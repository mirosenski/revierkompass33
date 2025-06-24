import { Link, useLocation } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function BreadcrumbNav() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Wenn wir auf der Home-Seite sind, zeige keinen Breadcrumb
  if (pathSegments.length === 0) return null;

  // Breadcrumb-Titel für verschiedene Routen
  const getBreadcrumbTitle = (segment: string, _index: number) => {
    switch (segment) {
      case "wizard":
        return "Wizard";
      case "step1":
        return "Schritt 1";
      case "step2":
        return "Schritt 2";
      case "step3":
        return "Schritt 3";
      case "about":
        return "Über uns";
      case "login":
        return "Login";
      default:
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  // Erstelle Breadcrumb-Items
  const breadcrumbItems = [];
  let currentPath = "";

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;

    const isLast = i === pathSegments.length - 1;
    const title = getBreadcrumbTitle(segment, i);

    if (isLast) {
      breadcrumbItems.push(
        <BreadcrumbItem key={currentPath}>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>,
      );
    } else {
      breadcrumbItems.push(
        <BreadcrumbItem key={currentPath}>
          <BreadcrumbLink asChild>
            <Link to={currentPath}>{title}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>,
      );
      breadcrumbItems.push(<BreadcrumbSeparator key={`separator-${currentPath}`} />);
    }
  }

  return (
    <nav className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.length > 0 && <BreadcrumbSeparator />}
            {breadcrumbItems}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </nav>
  );
}
