pragma solidity ^0.5.0;
import "./SafeMath.sol";

contract DMTWiFiBox {
    using SafeMath for uint;

    uint constant minutespercredit = 1;
    uint constant ratio = 100; // 1 dxn = 100 tokens
    struct userdata {
        address addr;
        uint credit;
        uint start;
        address pi;
    }
    mapping(address => userdata) users;

    event online(address from, address pi, uint ipaddr, uint maxtime);
    event offline(address from, address pi, uint starttm, uint endtm, uint creditused);

    function userregister() public {
        require(users[msg.sender].addr != address(0x0), "Already registered");
        users[msg.sender].addr = msg.sender;
    }

    function buytoken(address to) public payable {
        require(users[to].addr == to, "Not registered user");
        uint credit = msg.value * ratio / 10**18;
        users[to].credit = users[to].credit.add(credit);
    }

    function query(address to) public view returns (uint) {
        require(users[to].addr == to, "Not registered user");
        return users[to].credit;
    }

    function useronline(address pi, uint ipaddr) public {
        require(users[msg.sender].addr == msg.sender, "Not registered user");
        require(users[msg.sender].pi == address(0x0), "Not logoned on other Pi");
        users[msg.sender].pi = pi;
        users[msg.sender].start = now;
        uint maxtime = users[msg.sender].credit / minutespercredit;
        emit online(msg.sender, pi, ipaddr, maxtime);
    }

    function useroffline(address from) public {
        require(users[from].pi == msg.sender, "User didn't logoned on this Pi");
        uint starttm = users[from].start;
        uint endtm = now;
        uint creditused = (endtm - starttm) * minutespercredit;
        users[from].pi = address(0x0);
        users[from].start = 0;
        if (users[from].credit < creditused) { // not enough
            creditused = users[from].credit;
        }
        users[from].credit = users[from].credit.sub(creditused);
        emit offline(from, msg.sender, starttm, endtm, creditused);
    }
}