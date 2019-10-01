# Upload an app to DeployGate

This action uploads an application file to DeployGate. (Not official action of DeployGate.)

## Versions

See [Releases](https://github.com/jmatsu/dg-upload-app-action/releases) page.

## Inputs and Outpus

See *action.yml* of your version.

## Example

Please make sure your workflow will run when a branch is pushed.

```
on:
  push or pull_request
```

Add this action to steps.

```
uses: jmatsu/dg-upload-app-action@<version>
  with:
    app_owner_name: <your DeployGate account/organization name>
    api_token: ${{ secrets.DEPLOYGATE_API_TOKEN }} # for example
    public: false
    app_file_path: /path/to/app_file
```

For more detail, please read *action.yml* and [workflow examples](.github/workflows)

## License

[MIT License](LICENSE)
