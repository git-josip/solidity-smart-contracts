//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <0.9.0;


interface IERC20 {
    function totalSupply() external view returns (uint);
    function balanceOf(address who) external view returns (uint balance);
    function transfer(address to, uint value) external returns (bool success);


    function allowance(address owner, address spender) external view returns (uint remaining);
    function approve(address spender, uint value) external returns (bool success);
    function transferFrom(address from, address to, uint value) external returns (bool success);

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract Cryptos is IERC20 {
    string public name = "Cryptos";
    string public symbol = "CRPT";
    uint public decimals = 0; // max is 18

    uint public override totalSupply;

    address public founder;
    mapping(address => uint) public balances;

    mapping(address => mapping(address => uint)) public allowed;

    constructor() {
        totalSupply = 1000000;
        founder = msg.sender;
        balances[founder] = totalSupply;
    }

    function balanceOf(address who) public view override returns (uint balance) {
        return balances[who];
    }

    function transfer(address to, uint value) public override returns (bool success) {
        require(balances[msg.sender] >= value, "Not enugh funds!");

        balances[msg.sender] -= value;
        balances[to] += value;

        emit Transfer(msg.sender, to, value);

        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint remaining) {
        return allowed[owner][spender];
    }

    function approve(address spender, uint value) public override returns (bool success) {
        require(balances[msg.sender] >= value);
        require(value > 0);

        allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);

        return true;
    }

    function transferFrom(address from, address to, uint value) public override returns (bool success) {
        require(allowed[from][to] >= value);
        require(balances[msg.sender] >= value);

        balances[from] -= value;
        balances[to] -= value;
        allowed[from][to] -= value;

        return true;
    }
}

