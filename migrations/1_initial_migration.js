const Migrations = artifacts.require("Migrations");
const Contract = artifacts.require("Lottery");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Contract)
};
