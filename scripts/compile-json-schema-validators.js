const fs = require("fs");
const path = require("path");

const {
  default: compileSchemaValidators,
} = require("@rjsf/validator-ajv8/dist/compileSchemaValidators");
const inputDir = process.argv[2];
if (!inputDir) {
  console.error("Please provide an input directory");
  process.exit(1);
}
if (!fs.existsSync(inputDir)) {
  console.error("Input directory does not exist");
  process.exit(1);
}

const affiliationSchemaPath = path.resolve(
  path.join(inputDir, "affiliation.schema.json")
);
const affiliationSchemaValidatorPath = path.resolve(
  path.join(inputDir, "affiliation.schema.validate.js")
);

const affiliationSchema = require(affiliationSchemaPath);

const options = {
  additionalMetaSchemas: [],
  customFormats: {},
  ajvOptionsOverrides: {},
  ajvFormatOptions: {},
};

compileSchemaValidators(
  affiliationSchema,
  affiliationSchemaValidatorPath,
  options
);

const userSchemaPath = path.resolve(path.join(inputDir, "user.schema.json"));
const userSchemaValidatorPath = path.resolve(
  path.join(inputDir, "user.schema.validate.js")
);

const userSchema = require(userSchemaPath);

compileSchemaValidators(userSchema, userSchemaValidatorPath, options);
