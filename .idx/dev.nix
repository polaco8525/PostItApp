{ pkgs, ... }: {
  channel = "stable-23.11";

  packages = [
    pkgs.nodejs_18
    pkgs.jdk17
    pkgs.gradle
  ];

  env = {
    JAVA_HOME = "${pkgs.jdk17}";
  };

  idx = {
    extensions = [
      "msjsdiag.vscode-react-native"
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
    ];

    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
    };

    previews = {
      enable = true;
      previews = {};
    };
  };
}
