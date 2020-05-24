<p align="center">
  <a href="https://github.com/jmatsu/dg-upload-app-action/actions"><img alt="typescript-action status" src="https://github.com/jmatsu/dg-upload-app-action/workflows/build-test/badge.svg"></a>
</p>

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
    app_file_path: /path/to/app_file
```

NOTE: [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## License

[MIT License](LICENSE)

## Release

Actions are run from GitHub repos so we will checkin the packed dist folder. 

Then run [ncc](https://github.com/zeit/ncc) and push the results:
```bash
# Edit VERSION to the latest version e.g. v0.2.1
$ git switch [-c] releases/v0.2
$ yarn pack
$ git add -f dist
$ git commit -a -m "updates the production distribution"
$ git tag <version>
$ git push origin releases/v0.2
```

NOTE: [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
