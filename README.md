# DocNet Frontend

This is the full-stack proof of concept for the DocNet sovereign data management system. It consists of a Django backend for patient and doctor information dashboards with web3 integration, a vanilla js frontend using web3.js for access management, data encryption/decryption and uploading to smart contract storage, and a smart contract which gives patients control over granting and revoking database write permissions for health care providers.

## Moralis_Auth

This is a Django app that uses Moralis's Auth system to authenticate users, and provides a proof of concept admin dashboard for showing patient information including health records and healthcare providers.

## Contract-Frontend

This directory hosts the frontend for interacting with the smart contract and encrypting/decrypting patient data. It uses AES-256 encryption as a proof of concept, and uses web3.js for interacting with the DocNet smart contract. 

## Hardhat

The DocNet smart contract is hosted here. It handles granting and revoking database write permissions for health care providers, and also acts as a storage medium for encrypted patient data. 

