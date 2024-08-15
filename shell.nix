{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    nodejs
    esbuild

    firefox
    web-ext

    prettierd
  ];
}
