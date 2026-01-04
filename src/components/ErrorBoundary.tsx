import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Log para diagnóstico (não expõe dados sensíveis)
    console.error("Render error boundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-3">
            <p className="text-base font-medium">Ocorreu um erro ao carregar a página.</p>
            <p className="text-sm text-muted-foreground">Atualize a página e tente novamente.</p>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Recarregar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
