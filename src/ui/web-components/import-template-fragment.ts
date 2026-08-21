export function getFragmentOf(templateId: string) {
  return document.importNode(
    (document.getElementById(templateId) as HTMLTemplateElement).content
      .firstElementChild as Element,
    true,
  );
}
