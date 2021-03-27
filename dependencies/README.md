# Dependencies

This folder contains all 3rd party dependencies that are not immediately
compatible with Deno.

This is intended to hold git submodules of other repositories.

## Adding a submodule

To add a submodule use the git command:

`git submodule add REPO`

And then add the initialization steps to the Makefile `init` command, and
commit the `.gitmodules` file.
