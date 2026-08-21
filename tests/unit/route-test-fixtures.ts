import { createRoutes } from "../../src/routes";

export const wildcardRoutes = createRoutes({
  lab: {
    base: "lab",
    $: {
      param: "labId",
      widgets: {
        base: "widgets",
        $: {
          param: "widgetId",
          action: {
            base: "action",
            add: "add",
            row: {
              base: "row",
              $: {
                param: "rowId",
                move: {
                  base: "move",
                  down: "down",
                  up: "up",
                },
              },
            },
          },
        },
      },
    },
  },
});
