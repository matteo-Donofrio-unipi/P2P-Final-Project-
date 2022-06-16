const Migrations = artifacts.require("Migrations");
const Contract = artifacts.require("DAppContract");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Contract)
};
