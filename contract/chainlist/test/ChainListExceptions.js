var ChainList = artifacts.require("./ChainList.sol");

// test suite
contract('ChainList', function(accounts){
    var chainListInstance;
    var seller = accounts[1];
    var buyer = accounts[2];
    var articleName = "article 1";
    var articleDescription = "Description for article 1";
    var articlePrice = "5";

    it("should throw exception if you try buy article when there is no article for sale", function() {
        return ChainList.deployed().then(async function(instance) {
            chainListInstance = instance;
            return chainListInstance.buyArticle(1, {
                from: buyer,
                value: web3.utils.toWei(articlePrice, "ether")
            });
        })
            .then(assert.fail)
            .catch(function(error) {
                assert(true);
            }).then(function () {
                return chainListInstance.getNumberOfArticles()
            }).then(function(data) {
                assert.equal(data, 0, "number of articles must be 0");
            })
    });

    it("should throw exception if you try buy article that does not exist", function() {
        return ChainList.deployed().then(async function(instance) {
            chainListInstance = instance;
            return chainListInstance.sellArticle(articleName, articleDescription, web3.utils.toWei(articlePrice, "ether"), { from: seller});
        })
            .then(function() {
                return chainListInstance.buyArticle(2, {
                    from: seller,
                    value: web3.utils.toWei(articlePrice, "ether")
                });
            })
            .then(assert.fail)
            .catch(function(error) {
                assert(true);
            })
            .then(function () {
                return chainListInstance.articles(1)
            })
            .then(function (data) {
                assert.equal(data[0], 1, "id must be " + seller);
                assert.equal(data[1], seller, "seller must be " + seller);
                assert.equal(data[2], 0x0, "buyer must be empty");
                assert.equal(data[3], articleName, "article name must be " + articleName);
                assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
                assert.equal(
                    data[5],
                    web3.utils.toWei(articlePrice, "ether"),
                    "article price must be " + web3.utils.toWei(articlePrice, "ether")
                );
            })
    });

    it("should throw exception if you try buy your own article", function() {
        return ChainList.deployed().then(async function(instance) {
            chainListInstance = instance;
            return chainListInstance.buyArticle(1, {
                from: seller,
                value: web3.utils.toWei(articlePrice, "ether")
            });
        })
            .then(assert.fail)
            .catch(function(error) {
                assert(true);
            })
            .then(function () {
                return chainListInstance.articles(1)
            })
            .then(function (data) {
                assert.equal(data[0], 1, "id must be " + seller);
                assert.equal(data[1], seller, "seller must be " + seller);
                assert.equal(data[2], 0x0, "buyer must be empty");
                assert.equal(data[3], articleName, "article name must be " + articleName);
                assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
                assert.equal(
                    data[5],
                    web3.utils.toWei(articlePrice, "ether"),
                    "article price must be " + web3.utils.toWei(articlePrice, "ether")
                );
            })
    });

    it("should throw exception if you try buy an article with value different than price", function() {
        return ChainList.deployed().then(async function(instance) {
            chainListInstance = instance;
            return chainListInstance.buyArticle(1, {
                from: buyer,
                value: web3.utils.toWei(articlePrice + 1, "ether")
            });
        })
            .then(assert.fail)
            .catch(function(error) {
                assert(true);
            })
            .then(function () {
                return chainListInstance.articles(1)
            })
            .then(function (data) {
                assert.equal(data[0], 1, "id must be " + seller);
                assert.equal(data[1], seller, "seller must be " + seller);
                assert.equal(data[2], 0x0, "buyer must be empty");
                assert.equal(data[3], articleName, "article name must be " + articleName);
                assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
                assert.equal(
                    data[5],
                    web3.utils.toWei(articlePrice, "ether"),
                    "article price must be " + web3.utils.toWei(articlePrice, "ether")
                );
            })
    });

    it("should throw exception if you try buy an article that ahs already been sold", function() {
        return ChainList.deployed().then(async function(instance) {
            chainListInstance = instance;
            return chainListInstance.buyArticle(1, {
                from: buyer,
                value: web3.utils.toWei(articlePrice, "ether")
            });
        })
            .then(function() {
                return chainListInstance.buyArticle(1, {
                    from: buyer,
                    value: web3.utils.toWei(articlePrice, "ether")
                });
            })
            .then(assert.fail)
            .catch(function(error) {
                assert(true);
            })
            .then(function () {
                return chainListInstance.articles(1)
            })
            .then(function (data) {
                assert.equal(data[0], 1, "id must be " + seller);
                assert.equal(data[1], seller, "seller must be " + seller);
                assert.equal(data[2], buyer, "buyer must be empty");
                assert.equal(data[3], articleName, "article name must be " + articleName);
                assert.equal(data[4], articleDescription, "article description must be " + articleDescription);
                assert.equal(
                    data[5],
                    web3.utils.toWei(articlePrice, "ether"),
                    "article price must be " + web3.utils.toWei(articlePrice, "ether")
                );
            })
    });
});
