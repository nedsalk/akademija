import type { Specification } from "./types";

let certificateSpecs: Specification = {
  "student who passed the final test can download a certificate": async (dsl) => {
    const args = await dsl.certificate.given["a student who passed the final test"]();
    const downloadArgs = await dsl.certificate.when["they download their certificate"](args);
    await dsl.certificate.then["the certificate PDF contains the required completion data"](
      downloadArgs,
    );
  },
  "student who has not passed the final test cannot download a certificate": async (dsl) => {
    const args = await dsl.certificate.given["a student who has not passed the final test"]();
    await dsl.certificate.then["certificate download is unavailable"](args);
  },
  "student cannot download a certificate for another program's passed course": async (dsl) => {
    const args =
      await dsl.certificate.given[
        "a student enrolled in one program after passing a final test in another program"
      ]();
    const result =
      await dsl.certificate.when[
        "they download a certificate for the passed course from the other program"
      ](args);
    await dsl.certificate.then["the certificate is unavailable"](result);
  },
};

certificateSpecs = {};

export { certificateSpecs };
