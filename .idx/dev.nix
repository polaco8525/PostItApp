{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [ pkgs.nodejs_18 ];
  idx.workspace.onCreate.install = "npm install";
}
