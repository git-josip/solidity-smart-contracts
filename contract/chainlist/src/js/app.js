App = {
     web3Provider: null,
     contracts: {},
     account: 0x0,
     loading: false,

     init: async function() {
          const { ethereum } = window;

          await ethereum.request({ method: 'eth_requestAccounts' });
          web3 = new Web3(ethereum);
          App.web3Provider = web3.currentProvider;

          App.displayAccountInfo();

          return App.initWeb3();
     },
     displayAccountInfo: function () {
          web3.eth.getCoinbase(function(err, account) {
               if (err === null) {
                    App.account = account;
                    $('#account').text(account);

                    web3.eth.getBalance(account, function(err, balance) {
                         if (err === null) {
                              $('#accountBalance').text(web3.fromWei(balance + '', 'ether') + ' ETH');
                         }
                    })
               }
          });
     },
     initWeb3: function() {
          /*
          * Replace me...
          */

          return App.initContract();
     },

     initContract: function() {
         $.getJSON('ChainList.json', function(chainListArtifact) {
               // get contract artifact and instantiate contract abstraction
               App.contracts.ChainList = TruffleContract(chainListArtifact);
               // set provider for our contract
              App.contracts.ChainList.setProvider(App.web3Provider);

              // listen events
              App.listenToEvents();

              // retrieve article from the contract
              return App.reloadArticles();
         })
     },

     reloadArticles: function() {
          // avoid reentry
          if(App.loading) {
               return;
          }
          App.loading = true;

          // refresh account information because the balance might have changed
          App.displayAccountInfo();

          var chainListInstance;

          App.contracts.ChainList.deployed().then(function(instance) {
               chainListInstance = instance;
               return chainListInstance.getArticlesForSale();
          }).then(function(articleIds) {
               // retrieve the article placeholder and clear it
               $('#articlesRow').empty();

               for(var i = 0; i < articleIds.length; i++) {
                    var articleId = articleIds[i];
                    chainListInstance.articles(articleId.toNumber()).then(function(article){
                         App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
                    });
               }
               App.loading = false;
          }).catch(function(err) {
               console.error(err.message);
               App.loading = false;
          });
     },

     displayArticle: function(id, seller, name, description, price) {
          var articlesRow = $('#articlesRow');

          var etherPrice = web3.fromWei(price, "ether");

          var articleTemplate = $("#articleTemplate");
          articleTemplate.find('.panel-title').text(name);
          articleTemplate.find('.article-description').text(description);
          articleTemplate.find('.article-price').text(etherPrice + " ETH");
          articleTemplate.find('.btn-buy').attr('data-id', id);
          articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

          // seller
          if (seller === App.account) {
               articleTemplate.find('.article-seller').text("You");
               articleTemplate.find('.btn-buy').hide();
          } else {
               articleTemplate.find('.article-seller').text(seller);
               articleTemplate.find('.btn-buy').show();
          }

          // add this new article
          articlesRow.append(articleTemplate.html());
     },

     sellArticle: function() {
          // retrieve the detail of the article
          var _article_name = $('#article_name').val();
          var _description = $('#article_description').val();
          var _price = web3.toWei($('#article_price').val() || '0', "ether");

          if((_article_name.trim() == '') || (_price == 0)) {
               // nothing to sell
               return false;
          }

          App.contracts.ChainList.deployed().then(function(instance) {
               return instance.sellArticle(_article_name, _description, _price, {
                    from: App.account,
                    gas: 500000
               });
          }).then(function(result) {

          }).catch(function(err) {
               console.error(err);
          });
     },

     // listen to events triggered by the contract
     listenToEvents: function() {
          App.contracts.ChainList.deployed().then(function(instance) {
               instance.LogSellArticle({}, {}).watch(function(error, event) {
                    if (!error) {
                         $("#events").append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>');
                    } else {
                         console.error(error);
                    }
                    App.reloadArticles();
               });

               instance.LogBuyArticle({}, {}).watch(function(error, event) {
                    if (!error) {
                         $("#events").append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>');
                    } else {
                         console.error(error);
                    }
                    App.reloadArticles();
               });
          });
     },

     buyArticle: function() {
          event.preventDefault();

          // retrieve the article
          var _articleId = $(event.target).data('id');
          var _price = $(event.target).data('value');

          App.contracts.ChainList.deployed().then(function(instance){
               return instance.buyArticle(_articleId, {
                    from: App.account,
                    value: web3.toWei(_price, "ether"),
                    gas: 500000
               });
          }).catch(function(error) {
               console.error(error);
          });
     }
};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
