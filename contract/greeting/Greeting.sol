//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <0.9.0;

pragma experimental ABIEncoderV2;

contract Greeting {
    string public message;

    constructor() {
        message = "I am ready.";
    }

    function setMessage(string memory _message) public {
        message = _message;
    }
}
