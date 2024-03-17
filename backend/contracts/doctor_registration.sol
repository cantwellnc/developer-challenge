// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.10;

contract DoctorRegistration {

    struct Incident {
        uint256 id;
        string doctorName;
        string incidentDetails;
        string date;
        string location; 
        bool causedLicenseRevocation;

    }

    struct Registration {
        string doctorName;
        string stateOfRegistration;
    }

    enum RegistrationStatus { ACCEPTED, REJECTED, IGNORED }

    struct Response {
        RegistrationStatus status;
        string message; 
    }

    event DoctorRegistrationSubmitted(address indexed from, Registration x);
    
    event DoctorRegistrationAccepted(Registration x);

    event DoctorRegistrationRejected(Registration x, Incident reason);


    function equal(string memory str1, string memory str2) private  pure returns (bool) {
        // hack to get quick equality of strings, since solidity doesn't provide this for you
        return keccak256(abi.encodePacked(str1)) == keccak256(abi.encodePacked(str2));
    }

    function validate(string memory doctor, Registration memory currentRegistration, Incident[] memory incidentHistory, Registration[] calldata registrationHistory) public returns (Response memory ) {

        // Emit to chain that this doctor is attempting to register
        emit DoctorRegistrationSubmitted(msg.sender, currentRegistration);

        // Is the doctor already registered in this state? 
        uint i=0;
        for (i; i != registrationHistory.length; i += 1) {
            if (equal(registrationHistory[i].stateOfRegistration, currentRegistration.stateOfRegistration)) {
                string memory message = "Already registered";
                return Response(RegistrationStatus.IGNORED, message);
            }
        }

        if (incidentHistory.length > 0) {
            // if you have had any incidents, then we want to investigate further. 
            uint j=0;
            for (j; j != incidentHistory.length; j += 1) {
                if (incidentHistory[j].causedLicenseRevocation) {
                    // reject
                    string memory message = "rejected due to an incident that resulted in license revocation.";
                    // emit record of this attempt to register to the chain
                    emit DoctorRegistrationRejected(currentRegistration, incidentHistory[j]);
                    return Response(RegistrationStatus.REJECTED, message);
                }
            }
            // there are many incidents that could have not caused a license revocation to ignore, so we can just return the list of
            // incidents for the user to see
            string memory message = "accepted with warnings, since incident history is not empty.";
            return Response(RegistrationStatus.ACCEPTED, message);
        }
        
        // all looks good
        emit DoctorRegistrationAccepted(currentRegistration);
        string memory message = "accepted with no issues.";
        return Response(RegistrationStatus.ACCEPTED, message);
        
    }

}
