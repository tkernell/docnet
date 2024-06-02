var App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  accounts: [],
  contestAddress: {}, 
  tokenAddress: {},
  web3,
  tokenDecimals: 0,
  currentDepositLimit: null,
  depositId: 0, // Initialize depositId here
  deposits: {}, // Assuming you also need a structure to store deposit details

  _depositLimit: function() {
    return App.currentDepositLimit;
  },

  init: function () {
    console.log("App initialized");
    return App.initWeb3();
  },

  initWeb3: function () {
    return new Promise((resolve, reject) => {
      if (typeof web3 !== 'undefined') {
        console.log("Using web3 detected from external source like Metamask");
        App.web3Provider = window.ethereum;
        web3 = new Web3(window.ethereum);
        resolve(App.initEth()); // Ensure this resolves with initEth
      } else {
        console.log("Using localhost");
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        resolve(App.initEth()); // Ensure this resolves with initEth
      }
    });
  },

  initEth: function () {
    return ethereum.request({ method: "eth_requestAccounts" })
      .then(function (accounts) {
        App.account = accounts[0];
        return web3.eth.getChainId().then(function (result) {
          App.chainId = result;
          return App.initContestContract()
            .then(App.initTokenContract)
            .then(App.fetchCurrentDepositLimit);
        });
      }).catch(function(error) {
        console.error("Error during Ethereum account request:", error);
      });
  },

  initContestContract: function () {
    var pathToAbi = "./abis/Docnet.json";
    return new Promise(function(resolve, reject) {
      $.getJSON(pathToAbi, function (abi) {
        App.contracts.Contest = new web3.eth.Contract(abi);
        if (App.chainId === 11155111) {
          App.contracts.Contest.options.address = "0xDF43d45aCcBdAF1025b3aa8693F226F5DdccBfCc";
        } else if(App.chainId === 43113) {
          App.contracts.Contest.options.address = "0xf8f0faD8f4e3B5027Fc194977a8d51772837ef24";
        } else {
          App.contracts.Contest.options.address = "0xDF43d45aCcBdAF1025b3aa8693F226F5DdccBfCc";
        }
        console.log("Contract initialized");
        console.log("Contract address: " + App.contracts.Contest.options.address);
        resolve(); // Resolve after all setup is done
      }).fail(reject); // Handle JSON fetch failure
    });
  },

  setPageParams: function () {
    document.getElementById("connectedAddress").className = "contest-address-style";
    if (document.getElementById("connectedAddress")) {
        document.getElementById("connectedAddress").innerHTML = App.account;
    }
    console.log("Account:", App.account);
    console.log("Contest Address:", App.contracts.Contest.options.address); // Keep this line to log the address to the console
    console.log("Current Deposit Limit:", App.currentDepositLimit);
  },

  uintTob32: function (n) {
    let vars = web3.utils.toBN(n).toString('hex');
    vars = vars.padStart(64, '0');
    return  vars;
  },

  fetchPatientData: async function() {
    const patientAddress = document.getElementById('_patientAddress').value;
    const patientKey = document.getElementById('_patientKey').value;

    try {
        const key = await importKey(patientKey);

        App.contracts.Contest.methods.patientData(patientAddress).call({ from: App.account })
            .then(async function(result) {
                console.log("Patient data fetched successfully:", result);

                const { iv, data } = JSON.parse(result);
                const decryptedData = await decryptData(key, data, iv);

                document.getElementById('_patientData').value = decryptedData;
            })
            .catch(function(error) {
                console.error("Error fetching patient data:", error);
            });
    } catch (error) {
        console.error("Decryption error:", error);
    }
  },

  savePatientData: async function() {
    const patientAddress = document.getElementById('_patientAddress').value;
    const patientData = document.getElementById('_patientData').value;
    const patientKey = document.getElementById('_patientKey').value;

    try {
        const key = await importKey(patientKey);
        const { iv, data } = await encryptData(key, patientData);

        const encryptedData = JSON.stringify({ iv, data });

        App.contracts.Contest.methods.editData(patientAddress, encryptedData)
            .send({ from: App.account })
            .then(function(result) {
                console.log("Patient data saved:", result);
            })
            .catch(function(error) {
                console.error("Error saving patient data:", error);
            });
    } catch (error) {
        console.error("Encryption error:", error);
    }
  },

  grantAccess: function() {
    const doctorAddress = document.getElementById('doctorAddress').value;
    App.contracts.Contest.methods.updateEditPermissions(doctorAddress, true)
      .send({ from: App.account })
      .then(function(result) {
        console.log("Access granted:", result);
      })
      .catch(function(error) {
        console.error("Error granting access:", error);
      });
  },

  revokeAccess: function() {
    const doctorAddress = document.getElementById('doctorAddress').value;
    App.contracts.Contest.methods.updateEditPermissions(doctorAddress, false)
      .send({ from: App.account })
      .then(function(result) {
        console.log("Access revoked:", result);
      })
      .catch(function(error) {
        console.error("Error revoking access:", error);
      });
  },

};

$(function () {
  $(window).load(function () {
    console.log(document.getElementById('walletButton')); // Replace 'elementId' with the actual ID used at line 204
    document.getElementById("walletButton").disabled = false;
    App.init().then(function() {
      App.setPageParams(); // Ensure this is called after initialization
    }).catch(function(error) {
      console.error("Initialization failed:", error);
    });
  });
});

$(document).ready(function() {
    const walletButton = document.getElementById('walletButton');
    console.log(walletButton); // This should not be null if everything is correct
    let isConnected = false;

    walletButton.addEventListener('click', function() {
        if (!isConnected) {
            connectWallet();
        } else {
            disconnectWallet();
        }
    });

    function connectWallet() {
        console.log('Connecting wallet...');
        isConnected = true;
        walletButton.textContent = 'Disconnect Wallet';
        walletButton.disabled = false;
    }

    function disconnectWallet() {
        console.log('Disconnecting wallet...');
        isConnected = false;
        walletButton.textContent = 'Connect Wallet';
        walletButton.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', function() {
  const collapsibleToggle = document.querySelector('.collapsible-toggle');
  const collapsibleContent = document.querySelector('.collapsible-content');

  collapsibleToggle.addEventListener('click', function() {
    if (collapsibleContent.style.display === 'block') {
      collapsibleContent.style.display = 'none';
    } else {
      collapsibleContent.style.display = 'block';
    }
  });
});

// Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer) {
    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
    return window.btoa(binary);
}

// Import symmetric key (Base64 encoded)
async function importKey(base64Key) {
    const rawKey = base64ToArrayBuffer(base64Key);
    const key = await crypto.subtle.importKey(
        'raw',
        rawKey,
        'AES-CBC',
        true,
        ['encrypt', 'decrypt']
    );
    return key;
}

// Encrypt data
async function encryptData(key, data) {
    const iv = crypto.getRandomValues(new Uint8Array(16)); // Initialization vector
    const encodedData = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-CBC',
            iv: iv
        },
        key,
        encodedData
    );
    return {
        iv: arrayBufferToBase64(iv),
        data: arrayBufferToBase64(encrypted)
    };
}

// Decrypt data
async function decryptData(key, encryptedData, base64Iv) {
    const iv = base64ToArrayBuffer(base64Iv);
    const data = base64ToArrayBuffer(encryptedData);
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-CBC',
            iv: iv
        },
        key,
        data
    );
    return new TextDecoder().decode(decrypted);
}