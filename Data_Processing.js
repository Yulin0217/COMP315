// Import the Node.js module that allows working with files.
const fss = require('fs')
const fs = require('fs').promises
function convertKeyName(keyName) {
    //                                                                                                                          
    return keyName.toLowerCase().replace(/ /g, '_');
}

class Data_Processing {
    constructor() {
        this.raw_user_data = "";
        this.formatted_user_data = [];
        this.cleaned_user_data = [];
    }


    load_CSV(filename) {
        this.raw_user_data = fss.readFileSync(`${filename}.csv`, 'utf8');
    }

    async saveFormattedDataToFile(filePath) {
        try {
            //
            const dataString = JSON.stringify(this.formatted_user_data, null, 2);
            //
            await fs.writeFile(filePath, dataString, 'utf-8');
            console.log('Data saved to file successfully.');
        } catch (error) {
            console.error('Failed to save data to file:', error);
        }
    }


    format_data() {
        this.rawUserData = this.raw_user_data.split('\n').map(row => row.split(','));
        //
        this.formatted_user_data = this.rawUserData.map(row => {
            //
            const [fullName, dateOfBirth, age, email] = row.map(item => item.trim());

            //
            const validTitles = ["Mr", "Mrs", "Miss", "Ms", "Dr", "Dr."];

            //
            const nameParts = fullName.split(' ');
            //
            const title = validTitles.includes(nameParts[0]) ? nameParts[0] : "";
            //
            const namesWithoutTitle = title ? nameParts.slice(1).join(' ') : nameParts.join(' ');

            //
            const processedNames = namesWithoutTitle.split(' ').map(name =>
                name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
            ).join(' ');

            //
            const processedNameParts = processedNames.split(' ');
            const firstName = processedNameParts[0];
            const surname = processedNameParts[processedNameParts.length - 1];
            //
            const middleName = processedNameParts.length > 2 ? processedNameParts.slice(1, -1).join(' ') : '';


            //
            return {
                [convertKeyName('Title')]: title,
                [convertKeyName('First name')]: firstName,
                [convertKeyName('Middle name')]: middleName,
                [convertKeyName('Surname')]: surname,
                [convertKeyName('Date of birth')]: dateOfBirth,
                [convertKeyName('Age')]: Number(age),
                [convertKeyName('Email')]: email
            };
        });
    }

    cleanData() {
        this.cleanedUserData = this.formattedUserData.map(user => {
            //
            let {title, first_name, middle_name, surname, date_of_birth, age, email} = user;

            //
            title = this.cleanTitle(title);
            first_name = this.cleanName(first_name);
            middle_name = this.cleanName(middle_name);
            surname = this.cleanName(surname);
            date_of_birth = this.cleanDateOfBirth(date_of_birth);
            age = this.cleanAge(date_of_birth, age);
            email = this.cleanEmail(email, first_name, surname);

            return {title, first_name, middle_name, surname, date_of_birth, age, email};
        });
        console.log('Processing clean data section!');
    }

    //

    cleanTitle(title) {
        //
        const validTitles = ["Mr", "Mrs", "Miss", "Ms", "Dr", "Dr."];
        return validTitles.includes(title) ? title : "";
    }

    cleanName(name) {
        //
        return name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('-');
    }

    cleanDateOfBirth(dob) {
        //
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        return regex.test(dob) ? dob : "01/01/1900";
    }

    cleanAge(dob, age) {

        const calculatedAge = this.calculateAgeFromDob(dob);
        return calculatedAge.toString() === age ? age : calculatedAge.toString();
    }

    calculateAgeFromDob(dob) {
        const [day, month, year] = dob.split('/').map(part => parseInt(part, 10));
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    cleanEmail(email, firstName, surname) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (regex.test(email)) {
            return email;
        } else {
            const cleanFirstName = firstName.toLowerCase().replace(/\s+/g, '');
            const cleanSurname = surname.toLowerCase().replace(/\s+/g, '');
            return `${cleanFirstName}.${cleanSurname}@example.com`;
        }
    }


}

// const dataProcessor = new Data_Processing();
//
// // 直接按顺序执行方法
// dataProcessor.load_CSV("Raw_User_Data");
// dataProcessor.format_data();
// //dataProcessor.cleanData();
// dataProcessor.saveFormattedDataToFile("./formattedUserData.json");