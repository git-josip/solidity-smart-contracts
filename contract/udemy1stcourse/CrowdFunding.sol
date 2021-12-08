//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <0.9.0;

pragma experimental ABIEncoderV2;

contract CrowdFunding {
    struct Request {
        string description;
        address payable recipient;
        uint value;
        bool completed;
        uint noOfVoters;
        mapping(address => bool) voters;
    }

    event ContributeEvent(address _contributor, uint _value);
    event CreateRequestEvent(uint _eventNumber, string _description, address _recipient, uint _value);
    event MakePaymentEvent(uint _eventNumber, address _recipient, uint _value);

    address admin;
    mapping(address => uint) public contributors;
    uint public noOfCOntributors;
    uint public minimumCOntribution;
    uint public deadline; //timestamp
    uint public goal;
    uint public raisedAmount;

    mapping(uint => Request) public requests;
    uint public noOfRequests;


    constructor(uint _goal, uint _deadline) {
        admin = msg.sender;
        goal = _goal;
        deadline = block.timestamp + _deadline;
        minimumCOntribution = 100 wei;
    }


    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can create request!");
        _;
    }

    modifier onlyContributor() {
        require(contributors[msg.sender] > 0, "You must be a contributor to vote.");
        _;
    }

    function contribute() public payable {
        require(block.timestamp <= deadline, "Deadline has passed!");
        require(msg.value > minimumCOntribution, "Minimum contribution not met!");

        if (contributors[msg.sender] == 0) {
            noOfCOntributors++;
        }
        contributors[msg.sender] += msg.value;
        raisedAmount += msg.value;

        emit ContributeEvent(msg.sender, msg.value);
    }

    receive() payable external {
        contribute();
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    function getRefund() public {
        require(block.timestamp > deadline && address(this).balance < goal, "Refund condition not valid.");
        require(contributors[msg.sender] > 0, "Not a contributor!");

        address payable recipient = payable(contributors[msg.sender]);
        uint value = contributors[msg.sender];

        recipient.transfer(value);
        contributors[msg.sender] = 0;

    }

    function createRequest(string memory _description, address payable _recipient, uint _value) public onlyAdmin {
        Request storage newRequest = requests[noOfRequests];
        noOfRequests++;

        newRequest.description = _description;
        newRequest.recipient = _recipient;
        newRequest.value = _value;
        newRequest.completed = false;
        newRequest.noOfVoters = 0;

        emit CreateRequestEvent(noOfRequests-1, _description, _recipient, _value);
    }

    function voteRequest(uint _requestNo) public onlyContributor {
        require(_requestNo < noOfRequests, "Request does not exist.");

        Request storage thisRequest = requests[_requestNo];

        require(thisRequest.voters[msg.sender] == false, "You have already voted!");
        thisRequest.voters[msg.sender] = true;
        thisRequest.noOfVoters++;
    }

    function makePayment(uint _requestNo) public onlyAdmin {
        require(raisedAmount >= goal, "Goal not reached!");
        require(_requestNo < noOfRequests, "Request does not exist.");

        Request storage thisRequest = requests[_requestNo];
        require(thisRequest.completed == false, "Request. iscompleted.");
        require(thisRequest.noOfVoters > noOfCOntributors / 2, "50% of contributors must vote for this request.");

        thisRequest.recipient.transfer(thisRequest.value);
        thisRequest.completed = true;

        emit MakePaymentEvent(_requestNo, thisRequest.recipient, thisRequest.value);
    }
}
