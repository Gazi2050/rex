{
  description = "Rex - open-source lightweight cross-platform workspace terminal";

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }: let
    forAllSystems = nixpkgs.lib.genAttrs [ "x86_64-linux" "x86_64-darwin" "aarch64-darwin" ];
  in {
    packages = forAllSystems (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      rex = pkgs.callPackage ./nix/package.nix { };
      default = self.packages.${system}.rex;
    });

    nixosModules.rex = { pkgs, ... }: {
      environment.systemPackages = [ self.packages.${pkgs.system}.rex ];
    };

    darwinModules.rex = { pkgs, ... }: {
      environment.systemPackages = [ self.packages.${pkgs.system}.rex ];
    };
  };
}
