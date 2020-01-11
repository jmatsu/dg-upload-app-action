#!/usr/bin/env bash

set -eu

source /toolkit.sh

normalize_boolean() {
  if [[ "${1,,}" =~ ^(true|yes|y)$ ]]; then
    echo "true"
  else
    echo "false"
  fi
}

readonly action_version="$(cat /VERSION)"

github::debug "the action version is $action_version"

github::debug "inputs.exclude_pattern is ${INPUT_EXCLUDE_PATTERN:-}"

readonly github_ref="$(jq -r '.head.ref' || echo "$GITHUB_REF")"

# Don't use double-quote
if [[ -n "${INPUT_EXCLUDE_PATTERN:-}" ]] && [[ "$github_ref" =~ $INPUT_EXCLUDE_PATTERN ]]; then
  github::warning "$github_ref matched with ($INPUT_EXCLUDE_PATTERN) so this action does nothing."
  github::success
fi

readonly api_token="${INPUT_API_TOKEN:-${DPG_API_TOKEN:-${DEPLOYGATE_API_TOKEN:-}}}"

if [[ -z "${api_token:-}" ]]; then
  github::warning 'Could not get an api token.'
  github::error 'You must provide DEPLOYGATE_API_TOKEN through environment variables or inputs.api_token.'
  github::error 'Exit because api token is not found'
  github::failure
fi

readonly app_owner_name="${INPUT_APP_OWNER_NAME:-${DPG_APP_OWNER_NAME:-${DEPLOYGATE_USER_NAME:-${DEPLOYGATE_APP_OWNER_NAME:-}}}}"

github::debug "inputs.app_owner_name is ${INPUT_APP_OWNER_NAME:-}"
github::debug "DPG_APP_OWNER_NAMEis ${DPG_APP_OWNER_NAME:-}"
github::debug "DEPLOYGATE_USER_NAME is ${DEPLOYGATE_USER_NAME:-}"
github::debug "DEPLOYGATE_APP_OWNER_NAME is ${DEPLOYGATE_APP_OWNER_NAME:-}"
github::debug "app_owner_name: $app_owner_name will be used"

if [[ -z "${app_owner_name:-}" ]]; then
  github::warning 'Could not get an app owner name.'
  github::error 'You must provide DEPLOYGATE_APP_OWNER_NAME, DEPLOYGATE_USER_NAME through environment variables or inputs.app_owner_name.'
  github::error 'Exit because application owner name is not found'
  github::failure
fi

readonly app_path="${INPUT_APP_FILE_PATH}"

github::debug "inputs.app_file_path is ${INPUT_APP_FILE_PATH:-}"
github::debug "app_path: $app_path will be used"

if [[ -z "${app_path:-}" ]] || [[ ! -f "$app_path" ]]; then
  github::warning 'Could not get an app file path or a file is not found.'
  github::error 'Exit because application file cannot be detected'
  github::failure
fi

message="${INPUT_MESSAGE:-}"

github::debug "inputs.message is ${INPUT_MESSAGE:-}"

if [[ -z "$message" ]]; then
  github::warning 'Could not get a message. This action sets a default value.'
  message="${GITHUB_SHA:0:8} $(date "+%Y/%m/%d") Uploaded by $GITHUB_ACTOR through GitHub Action."
fi

github::debug "message: $message will be used"

readonly disable_notification="$(normalize_boolean ${INPUT_DISABLE_NOTIFICATION:-true})"

github::debug "inputs.disable_notification is ${INPUT_DISABLE_NOTIFICATION:-}"
github::debug "disable_notification: $disable_notification will be used"

if [[ "$(normalize_boolean ${INPUT_PUBLIC:-false})" == "true" ]]; then
  visibility='public'
else
  visibility='private'
fi

github::debug "inputs.public is ${INPUT_PUBLIC:-}"
github::debug "visibility: $visibility will be used"

readonly distribution_find_by="${INPUT_DISTRIBUTION_FIND_BY}"

github::debug "inputs.distribution_find_by is ${INPUT_DISTRIBUTION_FIND_BY:-}"

if [[ -z "${distribution_find_by:-}" ]]; then
  github::warning 'Could not get a distribution_find_by. Any distribution will not be operated.'
elif [[ ! "$distribution_find_by" =~ ^(key|name)$ ]]; then
  github::error 'distribution_find_by must be either key or name if privided.'
  github::error 'Exit because distribution_find_by is invalid'
  github::failure
fi

github::debug "distribution_find_by: $distribution_find_by will be used"

readonly distribution_id="${INPUT_DISTRIBUTION_ID:-}"

github::debug "inputs.distribution_id ${INPUT_DISTRIBUTION_ID:-}"
github::debug "distribution_id: $distribution_id will be used"

readonly release_note="${INPUT_RELEASE_NOTE:-}"

if [[ -n "${distribution_find_by:-}" ]] && [[ -z "${release_note:-}" ]]; then
  github::warning 'Could not get a release note. Use blank string.'
fi

readonly ignore_api_failure="$(normalize_boolean ${INPUT_IGNORE_API_FAILURE:-false})"

if [[ "$ignore_api_failure" != "true" ]]; then
  github::debug "never ignore api failures"

  curl() {
    command curl -f "$@"
  }
else
  github::debug "ignore api failures"
fi

declare -a options

{
  declare -a temp_fields=(
      "file=@$app_path"
      "message=$message"
      "release_note=$release_note"
      "disable_notify=$disable_notification"
      "visibility=$visibility"
  )

  for field in "${temp_fields[@]}"; do
    if [[ "$field" =~ ^.*=$ ]]; then
      github::debug "$field has been skipped because its value is empty"
      continue
    else
      github::debug "$field has been set"
      options+=("-F")
      options+=("$field")
    fi
  done
}

if [[ "$distribution_find_by" == "key" ]]; then
  github::debug "distribution will be found by key"

  if [[ -z "${distribution_id:-}" ]]; then
    github::warning 'Could not get a distribution id'
    github::error 'distribution_find_by == key must require an id of a distribution'
    github::error 'Exit because no key is found'
    github::failure
  fi

  github::debug "distribution_key will be $distribution_id"

  options+=("-F")
  options+=("distribution_key=$distribution_id")
elif [[ "$distribution_find_by" == "name" ]]; then
  github::debug "distribution will be found by name"

  if [[ -z "${distribution_id:-}" ]]; then
    github::warning 'Could not get a distribution id. This action sets a default value.'
    distribution_id="$github_ref"
  fi

  github::debug "distribution_name will be $distribution_id"

  options+=("-F")
  options+=("distribution_name=$distribution_id")
fi

cat <<EOF | github::debug
curl options:
${options[@]}
EOF

OUTPUT_DIRECTORY=/outputs

mkdir -p "$OUTPUT_DIRECTORY"
readonly response="$OUTPUT_DIRECTORY/$(basename $(mktemp))"

github::set_output "response_json_path" "$response"

curl -sSL \
  -A "dg-upload-app-action/$action_version (GithubAction; jmatsu/dg-upload-app-action)" \
  -H "Authorization: token $api_token" \
  -X POST \
  "https://deploygate.com/api/users/$app_owner_name/apps" \
  "${options[@]}" \
  -o "$response"

# Come here if the api call has been succeeded or ignore_api_failure is true
github::set_output "error_response" "$(cat $response | jq -r '.error')"

cat "$response" | \
  jq -r '
    .results | 
      {
        download_url: .file,
        package_name: .package_name,
        distribution_url: .distribution | .url,
        distribution_key: .distribution | .access_key
      }
  ' | \
  jq -r '
    to_entries|map("\(.key) \(.value|tostring)")|.[]
  ' | \
  github::set_output
