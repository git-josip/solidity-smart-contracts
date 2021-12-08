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

    function transfer(address to, uint value) public virtual  override returns (bool success) {
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

    function transferFrom(address from, address to, uint value) public virtual override returns (bool success) {
        require(allowed[from][to] >= value);
        require(balances[msg.sender] >= value);

        balances[from] -= value;
        balances[to] -= value;
        allowed[from][to] -= value;

        return true;
    }
}

contract CryptosICO is Cryptos {
    enum State { beforeStart, running, afterEnd, halted }
    event Invest(address investor, uint value, uint tokens);

    address public admin;
    address payable public deposit;
    uint tokenPrice = 0.001 ether; // 1ETH = 1000CRPT, 1CRPT = 0.001ETH
    uint public hardCap = 300 ether;
    uint public raisedAmount;
    uint public saleStart = block.timestamp;
    uint public saleEnd = block.timestamp + 604800; // ends in 1 week
    uint public tokenTradeStart = saleEnd + 604800;
    uint public maxInvestment = 5 ether;
    uint public minInvestment = 0.1 ether;


    State public icoState;

    constructor(address payable _deposit) {
        deposit = _deposit;
        admin = msg.sender;
        icoState = State.beforeStart;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin is allowed to do this action.");
        _;
    }

    modifier lockTokens() {
        assert(block.timestamp > tokenTradeStart);
        _;
    }

    function halt() public onlyAdmin {
        icoState = State.halted;
    }

    function resume() public onlyAdmin {
        icoState = State.running;
    }

    function changeDepositAddress(address payable _deposit) public onlyAdmin {
        deposit = _deposit;
    }

    function getCurrentState() public view returns(State) {
        if (icoState == State.halted) {
            return State.halted;
        } else if(block.timestamp < saleStart) {
            return State.beforeStart;
        } else if(block.timestamp > saleStart && block.timestamp < saleEnd) {
            return State.running;
        } else {
            return State.afterEnd;
        }
    }

    function invest() payable public returns(bool success) {
        require(getCurrentState() == State.running);
        require(msg.value >= minInvestment);
        require(msg.value <= maxInvestment);

        raisedAmount += msg.value;
        require(raisedAmount <= hardCap);

        uint tokens = msg.value / tokenPrice;
        balances[msg.sender] += tokens;
        balances[founder] -= tokens;

        deposit.transfer(msg.value);

        emit Invest(msg.sender, msg.value, tokens);

        return true;
    }

    receive() external payable {
        invest();
    }

    function transfer(address to, uint value) public lockTokens override returns (bool success) {
        super.transfer(to, value);
        return true;
    }

    function transferFrom(address from, address to, uint value) public lockTokens override returns (bool success) {
        return super.transferFrom(from, to, value);
    }

    function burn() public returns(bool) {
        icoState = getCurrentState();
        require(icoState == State.afterEnd);
        balances[founder] = 0;
        return true;
    }
}
