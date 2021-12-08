var ChainList = artifacts.require("./ChainList.sol");

// test suite
contract('ChainList', function(accounts){
    var chainListInstance;
    var seller = accounts[1];
    var buyer = accounts[2];

    var articleName1 = "article 1";
    var articleDescription1 = "Description for article 1";
    var articlePrice1 = "0.1";

    var articleName2 = "article 2";
    var articleDescription2 = "Description for article 2";
    var articlePrice2 = "0.2";

    var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
    var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

    it("should be initialized with empty values", function() {
        return ChainList.deployed().then(function(instance) {
            chainListInstance = instance;

            return chainListInstance.getNumberOfArticles();
        }).then(function(data) {
            assert.equal(data, 0, "number of articles must be 0");
            return chainListInstance.getArticlesForSale();
        }).then(function(data) {
            assert.equal(data.length, 0, "there should not be articles for sale");
        });
    });

    it("should sell a first article", function() {
        return ChainList.deployed().then(function(instance) {
            chainListInstance = instance;
            return chainListInstance.sellArticle(articleName1, articleDescription1, web3.utils.toWei(articlePrice1, "ether"), { from: seller});
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, 'one event should be triggered');
            assert.equal(receipt.logs[0].event, 'LogSellArticle', 'event should be LogSellArticle');
            assert.equal(receipt.logs[0].args._id, 1, 'first article id should be 1');
            assert.equal(receipt.logs[0].args._seller, seller, 'seller should match');
            assert.equal(receipt.logs[0].args._name, articleName1, 'name should match');
            assert.equal(receipt.logs[0].args._price,  web3.utils.toWei(articlePrice1, "ether"), 'price should match');

            return chainListInstance.getNumberOfArticles()
        }).then(function(data) {
            assert.equal(data, 1, "number of articles must be 1");
            return chainListInstance.getArticlesForSale();
        }).then(function(data) {
            assert.equal(data.length, 1, "there should be 1 article for sale");
            assert.equal(data[0], 1, "there should be article for sale with id equal to 1");

            return chainListInstance.articles(data[0]);
        }).then(function(data) {
            assert.equal(data[0], 1, 'id should match');
            assert.equal(data[1], seller, 'seller should match');
            assert.equal(data[2], 0x0, 'buy must not be defined');
            assert.equal(data[3], articleName1, 'name should match');
            assert.equal(data[4], articleDescription1, 'description should match');
            assert.equal(data[5],  web3.utils.toWei(articlePrice1, "ether"), 'price should match');
        });
    });

    it("should sell a second article", function() {
        return ChainList.deployed().then(function(instance) {
            chainListInstance = instance;
            return chainListInstance.sellArticle(articleName2, articleDescription2, web3.utils.toWei(articlePrice2, "ether"), { from: seller});
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, 'one event should be triggered');
            assert.equal(receipt.logs[0].event, 'LogSellArticle', 'event should be LogSellArticle');
            assert.equal(receipt.logs[0].args._id, 2, 'first article id should be 1');
            assert.equal(receipt.logs[0].args._seller, seller, 'seller should match');
            assert.equal(receipt.logs[0].args._name, articleName2, 'name should match');
            assert.equal(receipt.logs[0].args._price,  web3.utils.toWei(articlePrice2, "ether"), 'price should match');

            return chainListInstance.getNumberOfArticles()
        }).then(function(data) {
            assert.equal(data, 2, "number of articles must be 2");
            return chainListInstance.getArticlesForSale();
        }).then(function(data) {
            assert.equal(data.length, 2, "there should be 2 article for sale");
            assert.equal(data[1], 2, "there should be article for sale with id equal to 1");

            return chainListInstance.articles(data[1]);
        }).then(function(data) {
            assert.equal(data[0], 2, 'id should match');
            assert.equal(data[1], seller, 'seller should match');
            assert.equal(data[2], 0x0, 'buy must not be defined');
            assert.equal(data[3], articleName2, 'name should match');
            assert.equal(data[4], articleDescription2, 'description should match');
            assert.equal(data[5],  web3.utils.toWei(articlePrice2, "ether"), 'price should match');
        });
    });


    it("should buy an article", function() {
        return ChainList.deployed().then(async function(instance) {
            chainListInstance = instance;

            sellerBalanceBeforeBuy = await web3.eth.getBalance(seller);
            buyerBalanceBeforeBuy = await web3.eth.getBalance(buyer);

            return chainListInstance.buyArticle(1, {
                from: buyer,
                value: web3.utils.toWei(articlePrice1, "ether")
            });
        }).then(async function (receipt) {
            sellerBalanceAfterBuy = await web3.eth.getBalance(seller);
            buyerBalanceAfterBuy = await web3.eth.getBalance(buyer);

            assert.equal(receipt.logs.length, 1, 'one event should be triggered');
            assert.equal(receipt.logs[0].event, 'LogBuyArticle', 'event should be LogBuyArticle');
            assert.equal(receipt.logs[0].args._id, 1, 'id should match');
            assert.equal(receipt.logs[0].args._seller, seller, 'seller should match');
            assert.equal(receipt.logs[0].args._buyer, buyer, 'seller should match');
            assert.equal(receipt.logs[0].args._name, articleName1, 'name should match');
            assert.equal(receipt.logs[0].args._price,  web3.utils.toWei(articlePrice1, "ether"), 'price should match');

            const transaction = await web3.eth.getTransaction(receipt.tx);
            const txGasPrice = transaction.gasPrice

            assert.equal(buyerBalanceAfterBuy, buyerBalanceBeforeBuy - web3.utils.toWei(articlePrice1, "ether") - (receipt.receipt.gasUsed * txGasPrice));
            assert.equal(
                web3.utils.toBN(sellerBalanceAfterBuy.toString()).toString(),
                web3.utils.toBN(sellerBalanceBeforeBuy.toString()).add(web3.utils.toBN(web3.utils.toWei(articlePrice1, "ether").toString())).toString()
            );

            return chainListInstance.getArticlesForSale();
        }).then(function(data) {
            assert.equal(data.length, 1, "there should be 1 article for sale");
            assert.equal(data[0], 2, "there should be article for sale with id equal to 2");

            return chainListInstance.getNumberOfArticles()
        }).then(function(data) {
            assert.equal(data, 2, "number of articles must be 2");
        })
    });
});
