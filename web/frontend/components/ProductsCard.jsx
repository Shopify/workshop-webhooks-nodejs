import { useState } from "react";
import { Card, TextContainer } from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useAuthenticatedFetch } from "../hooks";

export function ProductsCard() {
  const emptyToastProps = { content: null };
  const [isLoading, setIsLoading] = useState(false);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const fetch = useAuthenticatedFetch();

  const toastMarkup = toastProps.content && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  const handleReconcile = async () => {
    setIsLoading(true);
    const response = await fetch("/api/products/tag");

    if (response.ok) {
      setToastProps({ content: "Products have been reconciled!" });
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setToastProps({
        content: "There was an error reconciling products",
        error: true,
      });
    }
  };

  return (
    <>
      {toastMarkup}
      <Card
        title="Reconcile Products"
        sectioned
        primaryFooterAction={{
          content: "Reconcile",
          onAction: handleReconcile,
          loading: isLoading,
        }}
      >
        <TextContainer spacing="loose">
          <p>
            Occasionally we might miss some product updates. To check
            everything's in sync, you can manually reconcile.
          </p>
        </TextContainer>
      </Card>
    </>
  );
}
