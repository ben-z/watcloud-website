import affiliationSchemaJSON from "@/build/fixtures/affiliation.schema.json";
import affiliationSchemaValidate from "@/build/fixtures/affiliation.schema.validate";
import RJSFFields from "@/components/rjsf-fields";
import RJSFTemplates from "@/components/rjsf-templates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { slugify } from "@/lib/utils";
import Form from "@rjsf/core"; // Or whatever theme you use
import {
  ValidatorFunctions,
  createPrecompiledValidator,
} from "@rjsf/validator-ajv8";
import { JSONSchema7 } from "json-schema";
import { Loader2 } from "lucide-react";
import { createRef, useState } from "react";

const validator = createPrecompiledValidator(
  {
    [affiliationSchemaJSON["$id"]]: affiliationSchemaValidate,
  } as ValidatorFunctions,
  affiliationSchemaJSON as JSONSchema7
);

const formRef = createRef<Form>()

export default function AffiliationForm() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit({ formData: data }: any) {
    setIsAlertOpen(true);
    setAlertTitle("Submitting");
    setAlertDescription("Please wait while we submit your request...");
    setIsSubmitting(true);

    const { name } = data;
    const slug = slugify(name);

    try {
      const res = await fetch("https://repo-ingestion.watonomous.ca/ingest", {
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
      });

      if (res.status === 200) {
        setAlertTitle("Success!");
        setAlertDescription(
          `Successfully submitted registration request for "${name}"!` +
            ` We will review your request and get back to you shortly.` +
            ` Your request ID is "${(await res.json()).pr_url}".`
        );
        if (!formRef.current) {
          console.error(`Form ref is not set! formRef: ${formRef}, formRef.current: ${formRef.current}`);
        } else {
          formRef.current.reset();
        }
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
    setIsSubmitting(false);
  }

  return (
    <div className="my-8">
      <Form
        schema={affiliationSchemaJSON as JSONSchema7}
        validator={validator}
        noHtml5Validate
        onSubmit={onSubmit}
        ref={formRef}
        showErrorList={"bottom"}
        focusOnFirstError={true}
        templates={RJSFTemplates}
        fields={RJSFFields}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isSubmitting ? (
              <AlertDialogAction disabled>
                <Loader2 className="animate-spin" />
              </AlertDialogAction>
            ) : (
              <AlertDialogAction>OK</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
