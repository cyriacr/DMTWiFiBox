pragma solidity ^0.5.0;
import "./SafeMath.sol";

contract DMTWiFiBox {
    using SafeMath for uint;
    uint constant maxdevices = 20;
    uint constant minutespercredit = 1;
    uint constant ratio = 100; // 1 dxn = 100 tokens
    struct devinfo {
        address addr;
        bytes32 name;
        address owner;        
    }
    mapping (address => devinfo) public devices;

    struct userdata {
        address addr;
        uint credit;
        uint start;
        address pi;
        address[] devices;
    }
    mapping(address => userdata) public users;

    event online(address indexed from, address indexed pi, uint ipaddr, uint maxtime);
    event deposit(address indexed from, address indexed to, uint credit);
    event deduction(address indexed from, address indexed owner, uint starttm, uint endtm, uint creditused);
    event offline(address indexed from, address pi);

    function registerUser() public returns (bool) {
        require(users[msg.sender].addr == address(0x0), "Already registered");
        users[msg.sender].addr = msg.sender;
        return true;
    }

    function registerDevice(address devaddr, bytes32 devname) public returns (bool) {
        require(devaddr != address(0x0), "Invalid device address");
        require(devices[devaddr].addr == address(0x0), "Already registered");
        devices[devaddr].addr = devaddr;
        devices[devaddr].name = devname;
        devices[devaddr].owner = msg.sender;
        bool found;
        for (uint i = 0; i < users[msg.sender].devices.length; i++) {
            if (users[msg.sender].devices[i] == address(0x0)) {
                users[msg.sender].devices[i] = devaddr;
                found = true;
                break;
            }
        }
        if (!found) {
            users[msg.sender].devices.push(devaddr);
        }
        return true;
    }

    function unregisterDevice(address devaddr) public returns (bool) {
        require(devaddr != address(0x0), "Invalid device address");
        require(devices[devaddr].addr == devaddr, "Not registered");
        for (uint i = 0; i < users[msg.sender].devices.length; i++) {
            if (users[msg.sender].devices[i] == devaddr) {
                users[msg.sender].devices[i] = address(0x0);
                break;
            }
        }
        devices[devaddr].addr = address(0x0);
        devices[devaddr].owner = address(0x0);
        return true;
    }

    function getUserDevices() public view returns(address[maxdevices] memory, bytes32[maxdevices] memory) {
        address[maxdevices] memory piaddrs;
        bytes32[maxdevices] memory pinames;
        uint n;
        for (uint i = 0; i < users[msg.sender].devices.length && n < maxdevices; i++) {
            if (users[msg.sender].devices[i] != address(0x0)) {
                piaddrs[n] = users[msg.sender].devices[i];
                pinames[n] = devices[users[msg.sender].devices[i]].name;
                n++;
            }
        }
        return (piaddrs, pinames);
    }

    function increaseCredit(address payable to) public payable {
        require(to != address(0x0), "Invalid address");
        require(users[to].addr == to, "Not registered user");
        uint credit = msg.value * ratio / 10**18;
        users[to].credit = users[to].credit.add(credit);
        emit deposit(msg.sender,to, credit);
    }

    function getUserCredit(address addr) public view returns (uint) {
        require(addr != address(0x0), "Invalid address");
        require(users[addr].addr == addr, "Not registered user");
        return users[addr].credit;
    }

    function userOnline(address pi, uint ipaddr) public {
        require(pi != address(0x0), "Invalid address");
        require(users[msg.sender].addr == msg.sender, "Not registered user");
        require(users[msg.sender].pi == address(0x0), "Not logoned on other Pi");
        users[msg.sender].pi = pi;
        users[msg.sender].start = now;
        uint maxtime = users[msg.sender].credit / minutespercredit;
        emit online(msg.sender, pi, ipaddr, maxtime);
    }

    function userOffline(address from) public {
        require(from != address(0x0), "Invalid address");
        require(users[from].pi == msg.sender, "User didn't logoned on this Pi");
        address piowner = devices[msg.sender].owner;
        uint starttm = users[from].start;
        uint endtm = now;
        uint creditused = (endtm - starttm) * minutespercredit;
        users[from].pi = address(0x0);
        users[from].start = 0;
        if (users[from].credit < creditused) { // not enough
            creditused = users[from].credit;
        }
        users[from].credit = users[from].credit.sub(creditused);
        emit offline(from, msg.sender);
        emit deduction(from, piowner, starttm, endtm, creditused);
    }
}