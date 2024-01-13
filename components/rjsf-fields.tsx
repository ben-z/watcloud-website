import { FieldProps, RegistryFieldsType } from "@rjsf/utils";

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
};

export default fields;
