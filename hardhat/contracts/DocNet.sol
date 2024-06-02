// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract MedData {
    mapping(address => PatientData) public patientData;
    
    struct PatientData {
        mapping(address => bool) canEdit;
        string encryptedData;
    }

    function editData(address _patientAddr, string calldata _encryptedData) public {
        PatientData storage _patientData = patientData[_patientAddr];
        require(_patientData.canEdit[msg.sender]);
        _patientData.encryptedData = _encryptedData;
    }

    function updateEditPermissions(address _editor, bool _canEdit) public {
        PatientData storage _patientData = patientData[msg.sender];
        _patientData.canEdit[_editor] = _canEdit;
    }
}
