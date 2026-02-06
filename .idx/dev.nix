# Project IDX Configuration for PostItApp
# React Native Android Development Environment

{ pkgs, ... }: {
  # Channel selection for packages
  channel = "stable-23.11";

  # Packages to install in the environment
  packages = [
    # Node.js runtime (LTS version 18+)
    pkgs.nodejs_18

    # Package managers
    pkgs.yarn
    pkgs.nodePackages.npm

    # Java Development Kit (required for Android)
    pkgs.jdk17

    # Android SDK and tools
    pkgs.android-tools

    # Build tools
    pkgs.gradle

    # Development utilities
    pkgs.git
    pkgs.watchman
    pkgs.unzip
    pkgs.curl
    pkgs.wget

    # Code formatting
    pkgs.nodePackages.prettier

    # TypeScript support
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server
  ];

  # Environment variables
  env = {
    # Android SDK configuration
    ANDROID_HOME = "$HOME/Android/Sdk";
    ANDROID_SDK_ROOT = "$HOME/Android/Sdk";

    # Java configuration
    JAVA_HOME = "${pkgs.jdk17}";

    # Add Android tools to PATH
    PATH = "$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH";

    # React Native configuration
    REACT_NATIVE_PACKAGER_HOSTNAME = "0.0.0.0";

    # Gradle configuration for better performance
    GRADLE_OPTS = "-Xmx4096m -Dorg.gradle.daemon=true -Dorg.gradle.parallel=true";
  };

  # IDX-specific configuration
  idx = {
    # Extensions to install in the IDE
    extensions = [
      "msjsdiag.vscode-react-native"
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "dsznajder.es7-react-js-snippets"
      "bradlc.vscode-tailwindcss"
      "formulahendry.auto-rename-tag"
      "christian-kohler.path-intellisense"
      "ms-vscode.vscode-typescript-next"
      "naumovs.color-highlight"
      "eamodio.gitlens"
    ];

    # Workspace configuration
    workspace = {
      # Run on workspace creation
      onCreate = {
        # Install npm dependencies
        install-deps = "npm install";

        # Setup Android SDK if not present
        setup-android = ''
          if [ ! -d "$HOME/Android/Sdk" ]; then
            mkdir -p $HOME/Android/Sdk
            echo "Android SDK directory created at $HOME/Android/Sdk"
          fi
        '';

        # Configure git for the project
        git-config = ''
          git config --local core.autocrlf input
          git config --local core.eol lf
        '';

        # Create local.properties for Android
        android-local-props = ''
          echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
        '';
      };

      # Run when workspace starts
      onStart = {
        # Ensure dependencies are up to date
        check-deps = "npm install --prefer-offline";
      };
    };

    # Preview configurations
    previews = {
      enable = true;

      previews = {
        # Android Emulator Preview
        android = {
          command = ["npm" "run" "android"];
          manager = "flutter";
          env = {
            REACT_NATIVE_PACKAGER_HOSTNAME = "0.0.0.0";
          };
        };

        # Metro Bundler Web Preview
        web = {
          command = [
            "npx"
            "react-native"
            "start"
            "--port"
            "8081"
            "--host"
            "0.0.0.0"
          ];
          manager = "web";
          env = {
            PORT = "8081";
            REACT_NATIVE_PACKAGER_HOSTNAME = "0.0.0.0";
          };
        };
      };
    };
  };

  # Android Emulator configuration
  android = {
    enable = true;

    # Flutter is required for Android emulator support in IDX
    flutter = {
      enable = true;
    };

    # Emulator configuration
    emulator = {
      enable = true;

      # Pixel 5 with API 33 (Android 13)
      device = "pixel_5";
      apiLevel = 33;

      # System image
      systemImage = "google_apis_playstore";

      # Emulator options
      options = [
        "-no-boot-anim"
        "-no-snapshot-save"
        "-gpu"
        "swiftshader_indirect"
        "-memory"
        "2048"
      ];
    };
  };

  # Services to run
  services = {
    # Enable Docker if needed for additional services
    docker = {
      enable = false;
    };
  };
}
