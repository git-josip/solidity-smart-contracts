//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <0.9.0;

pragma experimental ABIEncoderV2;

contract AuctionCreator {
    address public owner;
    Auction[] public auctions;

    function createAucton() public {
        Auction newAuction = new Auction(payable(msg.sender));
        auctions.push(newAuction);
    }
}

contract Auction {
    address payable public owner;
    uint public startBlock;
    uint public endBlock;
    string public ipfsHash;

    enum State {Started, Running, Ended, Canceled}
    State public auctionState;

    uint public highestBindingBid;
    address payable public highestBidder;

    mapping(address => uint) public bids;
    uint bidIncrement;
    bool ownerFinalized;

    constructor(address payable eoa) {
        owner = eoa;
        auctionState = State.Running;
        startBlock = block.number;
        endBlock = startBlock + 40320; // this is 1 week. as block is generated every 15sec and this is numer of blocks in 1 week.
        ipfsHash= "";
        bidIncrement = 100;
        ownerFinalized = false;
    }

    modifier notOwner() {
        require(msg.sender != owner);
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier afterStart() {
        require(block.number >= startBlock);
        _;
    }

    modifier beforeEnd() {
        require(block.number <= endBlock);
        _;
    }

    function min(uint a, uint b) internal pure returns(uint)  {
        if(a < b) {
            return a;
        } else {
            return b;
        }
    }

    function cancelAuction() public onlyOwner {
        auctionState = State.Canceled;

    }

    function placeBid() public payable notOwner afterStart beforeEnd {
        require(auctionState == State.Running);
        require(msg.value >= 100);

        uint currentBid = bids[msg.sender] + msg.value;
        require(currentBid > highestBindingBid);

        bids[msg.sender] = currentBid;
        if(currentBid <= bids[highestBidder]) {
            highestBindingBid = min(currentBid + bidIncrement, bids[highestBidder]);
        } else {
            highestBindingBid = min(currentBid, bids[highestBidder] + highestBindingBid);
            highestBidder = payable(msg.sender);
        }
    }

    function finalizeAuction() public {
        // the auction has been Canceled or Ended
        require(auctionState == State.Canceled || block.number > endBlock);

        // only the owner or a bidder can finalize the auction
        require(msg.sender == owner || bids[msg.sender] > 0);

        // the recipient will get the value
        address payable recipient;
        uint value;

        if(auctionState == State.Canceled){ // auction canceled, not ended
            recipient = payable(msg.sender);
            value = bids[msg.sender];
        }else{// auction ended, not canceled
            if(msg.sender == owner && ownerFinalized == false){ //the owner finalizes the auction
                recipient = owner;
                value = highestBindingBid;

                //the owner can finalize the auction and get the highestBindingBid only once
                ownerFinalized = true;
            }else{// another user (not the owner) finalizes the auction
                if (msg.sender == highestBidder){
                    recipient = highestBidder;
                    value = bids[highestBidder] - highestBindingBid;
                }else{ //this is neither the owner nor the highest bidder (it's a regular bidder)
                    recipient = payable(msg.sender);
                    value = bids[msg.sender];
                }
            }
        }

        // resetting the bids of the recipient to avoid multiple transfers to the same recipient
        bids[recipient] = 0;

        //sends value to the recipient
        recipient.transfer(value);

    }
}
