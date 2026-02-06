# IDX Template Bootstrap Configuration
# This file defines how the template is initialized in Project IDX

{ pkgs, ... }: {
  # Bootstrap script that runs when creating a new workspace from this template
  bootstrap = ''
    # Copy the template files to the workspace
    mkdir -p "$WS_NAME"
    cp -rf ${./.}/* "$WS_NAME/"
    cp -rf ${./.}/.* "$WS_NAME/" 2>/dev/null || true

    # Navigate to workspace
    cd "$WS_NAME"

    # Remove template-specific files that shouldn't be in the final project
    rm -f idx-template.nix idx-template.json 2>/dev/null || true

    # Initialize git repository if not already initialized
    if [ ! -d ".git" ]; then
      git init
      git add .
      git commit -m "Initial commit from IDX template"
    fi

    # Ensure correct permissions
    chmod -R 755 .

    # Install Node.js dependencies
    npm install

    # Setup Android local.properties
    mkdir -p android
    echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties

    # Create necessary directories
    mkdir -p .idx

    # Display success message
    echo "========================================"
    echo "  PostItApp initialized successfully!  "
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo "1. Start Metro bundler: npm start"
    echo "2. Run on Android: npm run android"
    echo ""
    echo "Happy coding!"
  '';
}
