import type { FC, PropsWithChildren } from "hono/jsx";
import { Header } from "./organisms/Header";

interface User {
  id: string;
  email: string;
  name: string;
}

type Template = "teacher-lesson-template" | "course-detail-template" | "auth-template";

interface MainProps extends PropsWithChildren {
  className?: string;
  user: User | null;
  cssTemplate: Template | undefined;
}

export const Main: FC<MainProps> = (props) => {
  const basePath = process.env.BASE_PATH || "/";

  console.log(props.cssTemplate);
  return (
    <html lang="en">
      <head>
        <title>Akademija</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1f4d3d" />
        <base href={basePath} />
        {/* <link rel="icon" href="static/ui/logo.svg" type="image/svg+xml" /> */}
        {/* <link rel="manifest" href={routes.manifest.toString()} /> */}
        <link rel="stylesheet" href="static/ui/main.css" />
        {props.cssTemplate && (
          <link rel="stylesheet" href={`static/ui/templates/${props.cssTemplate}.css`} />
        )}
      </head>
      <body>
        <Header user={props.user} />
        <main className={props.cssTemplate}>{props.children}</main>
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("${routes.serviceWorker.toString()}");
  });
}
            `.trim(),
          }}
        /> */}
      </body>
    </html>
  );
};
