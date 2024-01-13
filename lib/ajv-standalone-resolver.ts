// This file implements a [resolver](https://react-hook-form.com/advanced-usage#CustomHookwithResolver)
// for react-hook-form that uses [ajv standalone validation](https://ajv.js.org/standalone.html).
// Derived from
// - https://github.com/react-hook-form/resolvers/tree/1bfc6abbe99677fe574f0919f84b385cc4e686f4/ajv/src
// - https://github.com/react-hook-form/resolvers/tree/1bfc6abbe99677fe574f0919f84b385cc4e686f4/src

import { validateFieldsNatively } from "@hookform/resolvers";
import { DefinedError, ValidateFunction } from "ajv";
import {
  set,
  get,
  FieldErrors,
  Field,
  InternalFieldName,
  FieldValues,
  ResolverOptions,
  ResolverResult,
  appendErrors,
  FieldError,
} from "react-hook-form";

function flattenPrimitiveArrays<TFieldValues extends FieldValues>(
  paths: string[],
  values: TFieldValues,
): TFieldValues {
  values = structuredClone(values);
  for (const path of paths) {
    const segments = path.replace(/^\./, "").split(".");
    let current = values;
    for (let i = 0; i < segments.length; i++) {
      if (i === segments.length - 1) {
        (current[segments[i]] as FieldValues) = current[segments[i]].map((x: any) =>
          x ? x.value : x
        );
      } else if (current[segments[i]] === undefined) {
        break;
      } else {
        current = current[segments[i]];
      }
    }
  }
  return values;
}

export type Resolver = <TFieldValues extends FieldValues>(
  validate: ValidateFunction,
  factoryOptions?: {
    mode?: "async" | "sync";
    primitiveArrayPaths?: string[];
  }
) => <TContext>(
  values: TFieldValues,
  context: TContext | undefined,
  options: ResolverOptions<TFieldValues>
) => Promise<ResolverResult<TFieldValues>>;

const parseErrorSchema = (
  ajvErrors: DefinedError[],
  validateAllFieldCriteria: boolean
) => {
  // Ajv will return empty instancePath when require error
  ajvErrors.forEach((error) => {
    if (error.keyword === "required") {
      error.instancePath += "/" + error.params.missingProperty;
    }
  });

  return ajvErrors.reduce<Record<string, FieldError>>((previous, error) => {
    // `/deepObject/data` -> `deepObject.data`
    const path = error.instancePath.substring(1).replace(/\//g, ".");

    if (!previous[path]) {
      previous[path] = {
        message: error.message,
        type: error.keyword,
      };
    }

    if (validateAllFieldCriteria) {
      const types = previous[path].types;
      const messages = types && types[error.keyword];

      previous[path] = appendErrors(
        path,
        validateAllFieldCriteria,
        previous,
        error.keyword,
        messages
          ? ([] as string[]).concat(messages as string[], error.message || "")
          : error.message
      ) as FieldError;
    }

    return previous;
  }, {});
};

export const toNestErrors = <TFieldValues extends FieldValues>(
  errors: FieldErrors,
  options: ResolverOptions<TFieldValues>
): FieldErrors<TFieldValues> => {
  options.shouldUseNativeValidation && validateFieldsNatively(errors, options);

  const fieldErrors = {} as FieldErrors<TFieldValues>;
  for (const path in errors) {
    const field = get(options.fields, path) as Field["_f"] | undefined;
    const error = Object.assign(errors[path] || {}, {
      ref: field?.ref || field?.value?.ref,
    });

    if (isNameInFieldArray(options.names || Object.keys(errors), path)) {
      const fieldArrayErrors = Object.assign({}, get(fieldErrors, path));

      set(fieldArrayErrors, "root", error);
      set(fieldErrors, path, fieldArrayErrors);
    } else {
      set(fieldErrors, path, error);
    }
  }

  return fieldErrors;
};

const isNameInFieldArray = (
  names: InternalFieldName[],
  name: InternalFieldName
) => {
  const ret = names.some((n) =>
    n.replace(/^\./, "").startsWith(name + ".")
  );

  return ret
};

export const ajvResolver: Resolver =
  (validate, resolverOptions = {}) =>
  async (values, context, options) => {
    const { primitiveArrayPaths } = resolverOptions;
    // Preprocess values to flatten primitive arrays
    if (primitiveArrayPaths) {
      values = flattenPrimitiveArrays(primitiveArrayPaths, values);
    }

    const valid = validate(values);
    // Postprocess error paths to unflatten primitive arrays
    if (primitiveArrayPaths) {
      validate.errors = validate.errors?.map(e => {
        const path = e.instancePath.replaceAll("/", ".");
        if (primitiveArrayPaths.some(p => path.startsWith(p + "."))) {
          e.instancePath += "/value";
        }
        return e;
      })
    }

    options.shouldUseNativeValidation && validateFieldsNatively({}, options);

    const ret = valid
      ? { values, errors: {} }
      : {
          values: {},
          errors: toNestErrors(
            parseErrorSchema(
              validate.errors as DefinedError[],
              !options.shouldUseNativeValidation &&
                options.criteriaMode === "all"
            ),
            options
          ),
        };

    return ret;
  };
