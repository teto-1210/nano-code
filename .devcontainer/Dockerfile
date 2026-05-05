FROM oven/bun:1.3

# Install tools
# --no-install-recommends -< avoid installing unnecessary packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    sudo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create Non-root user
RUN useradd -ms /bin/bash vscode
RUN usermod -aG sudo vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/vscode \
    && chmod 440 /etc/sudoers.d/vscode

USER vscode
WORKDIR /nano-code

# Set Environment Variables
ENV DEVCONTAINER=true
ENV PATH="/home/vscode/.bun/bin:$PATH"

# Separate Cashe for user
ENV BUN_INSTALL_CACHE_DIR=/home/vscode/.bun-cache
RUN mkdir -p BUN_INSTALL_CACHE_DIR

CMD ["bash"]