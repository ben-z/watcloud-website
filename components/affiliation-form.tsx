import affiliationSchemaJSON from "@/build/fixtures/affiliation.schema.json";
import affiliationSchemaValidate from "@/build/fixtures/affiliation.schema.validate";
import { JSONSchema7 } from "json-schema";
import JSONSchemaForm from "@/components/json-schema-form";
import { ValidateFunction } from "ajv";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { slugify } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";

export default function AffiliationForm() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");

  async function onSubmit(data: any, form: UseFormReturn) {
    setIsAlertOpen(true);
    setAlertTitle("Submitting")
    setAlertDescription("Please wait while we submit your request...");

    const { name } = data;
    const slug = slugify(name);

    try {
      const res = await fetch(
        "https://repo-ingestion.watonomous.ca/ingest",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repo: "watonomous/infra-config",
            branch_suffix: `affiliation-${slug}`,
            files: [
              {
                path: `directory/affiliations/data/${slug}.yml`,
                content: JSON.stringify(data),
                transforms: [{ type: "json2yaml" }],
              },
            ],
          }),
        }
      );

      if (res.status === 200) {
        setAlertTitle("Success!");
        setAlertDescription(
          `Successfully submitted registration request for "${name}"!`
          + ` We will review your request and get back to you shortly.`
          + ` Your request ID is "${(await res.json()).pr_url}".`);
        form.reset();
      } else {
        setAlertTitle("Error");
        setAlertDescription(
          `Something went wrong! Error code: ${
            res.status
          }. Error message: "${await res.text()}".`
        );
      }
    } catch (e) {
      setAlertTitle("Error");
      setAlertDescription(
        `Something went wrong! Network request failed with error "${e}".`
      );
    }
  }
  return (
    <>
      <JSONSchemaForm
        schema={affiliationSchemaJSON as JSONSchema7}
        validate={affiliationSchemaValidate as unknown as ValidateFunction}
        onSubmit={onSubmit}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
