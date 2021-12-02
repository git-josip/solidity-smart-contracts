//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <0.9.0;

pragma experimental ABIEncoderV2;

contract Lottery {
    address payable[] public players;
    address public manager;

    constructor() {
        manager = msg.sender;
    }

    receive() external payable {
        require(msg.value == 0.1 ether, "Only 0.1 ETH is allowed");

        players.push(payable(msg.sender));

    }

    function getBalance() public view returns(uint){
        require(msg.sender == manager);

        return address(this).balance;
    }

    function random() public view returns(uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players.length)));
    }

    function pickWinner() public {
        require(msg.sender == manager);
        require(players.length >= 3);

        uint randomIndex = this.random() % players.length;
        address payable winner = players[randomIndex];

        winner.transfer(this.getBalance());
        players = new address payable[](0); // Reseting the Lottery
    }
}
