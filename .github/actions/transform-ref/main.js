const core = require('@actions/core');
const github = require('@actions/github');

try {
  const ref = github.context.payload.ref;

  let distribution_name = null;

  if (ref.startsWith("feature/")) {
    distribution_name = ref.substring("feature/".length, ref.length);
  } else if (ref.startsWith("v")) {
    distribution_name = 'release'
  } else if (ref === 'release') {
    distribution_name = 'release ready'
  } else {
    distribution_name = ref;
  }

  core.setOutput("distribution_name", distribution_name);
} catch (error) {
  core.setFailed(error.message);
}