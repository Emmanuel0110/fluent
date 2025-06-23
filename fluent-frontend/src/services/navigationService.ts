import { View } from "../types";

export class NavigationService {
  private viewHistory: View[] = [];
  private viewIndex: number = 0;
  private preventHistorization: boolean = false;

  addToHistory(view: View): void {
    if (this.preventHistorization) {
      this.preventHistorization = false;
    } else {
      if (this.viewHistory.length > 0) {
        this.viewHistory = this.viewHistory.slice(0, this.viewIndex + 1);
      }
      this.viewIndex = this.viewHistory.push(view) - 1;
    }
  }

  canGoBack(): boolean {
    return this.viewIndex > 0;
  }

  canGoForward(): boolean {
    return this.viewIndex < this.viewHistory.length - 1;
  }

  goBack(): View | null {
    if (this.canGoBack()) {
      this.viewIndex--;
      return this.getView(this.viewIndex);
    }
    return null;
  }

  goForward(): View | null {
    if (this.canGoForward()) {
      this.viewIndex++;
      return this.getView(this.viewIndex);
    }
    return null;
  }

  private getView(index: number): View {
    this.preventHistorization = true;
    return this.viewHistory[index];
  }
}
