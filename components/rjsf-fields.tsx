import {
  FieldProps,
  FormContextType,
  RJSFSchema,
  RegistryFieldsType,
  StrictRJSFSchema,
} from "@rjsf/utils";

const REQUIRED_ELEM = (
  <span className="text-red-500" role="presentation" aria-hidden="true">
    *
  </span>
);

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 * @note Derived from https://github.com/rjsf-team/react-jsonschema-form/blob/294b9e3d37c96888a0e8bb3c68a5b2b1afd452bf/packages/core/src/components/templates/TitleField.tsx
 */
function CustomTitleField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldProps<T, S, F>) {
  const { id, title, required } = props;
  return (
    <legend id={id}>
      {title}
      {required && REQUIRED_ELEM}
    </legend>
  );
}

const CustomArraySchemaField = function (props: FieldProps) {
  const { schema, registry, uiSchema = {} } = props;
  const { SchemaField } = registry.fields;
  if (schema.type === "string") {
    // Remove label for string arrays
    uiSchema["ui:label"] ||= false;
  }
  return <SchemaField {...props} uiSchema={uiSchema} />;
};

const fields: RegistryFieldsType = {
  ArraySchemaField: CustomArraySchemaField,
  TitleField: CustomTitleField,
};

export default fields;
