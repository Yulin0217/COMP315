// Import the Node.js module that allows working with files.
const fs = require('fs').promises;

function convertKeyName(keyName) {
    // 将字符串转换为小写并替换空格为下划线
    return keyName.toLowerCase().replace(/ /g, '_');
}

class DataProcessing {
    constructor() {
        // Initialize an empty array to store raw user data
        this.rawUserData = [];
        // Initialize formatted user data storage
        this.formattedUserData = [];

        this.cleanedUserData = [];
    }

    // Method to load CSV data using the fs module
    // Used resource from: https://www.digitalocean.com/community/tutorials/how-to-work-with-files-using-the-fs-module-in-node-js
    //                     https://futurestud.io/tutorials/node-js-read-file-content-as-string#:~:text=Read%20a%20File's%20Content%20as%20a%20String,-Node.&text=js%20comes%20with%20the%20fs,utf8'%20as%20the%20encoding%20option.
    //                     https://stackoverflow.com/questions/49098369/reading-a-csv-file-in-javascript-line-by-line-and-put-it-into-an-array-using-a
    async loadCSV(filename) {
        try {
            // Asynchronously read the file contents
            const data = await fs.readFile(`${filename}.csv`, 'utf-8');
            // Split file content into records by newline, then split each line by comma into fields
            this.rawUserData = data.split('\n').map(row => row.split(','));
            console.log('CSV loaded.');

            // // Display loaded data

        } catch (error) {
            // Log error information to the console if file reading fails
            console.error('CSV not loaded for:', error);
        }
    }

    async saveFormattedDataToFile(filePath) {
        try {
            //
            const dataString = JSON.stringify(this.formattedUserData, null, 2); // 使用null和2作为参数，以获得格式化的JSON字符串
            //
            await fs.writeFile(filePath, dataString, 'utf-8');
            console.log('Data saved to file successfully.');
        } catch (error) {
            console.error('Failed to save data to file:', error);
        }
    }


    formatData() {
        //
        this.formattedUserData = this.rawUserData.map(row => {
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
            ).join(' '); // 重新组合为字符串，其中每个单词的首字母大写，其他字母小写

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
                [convertKeyName('Age')]: age,
                [convertKeyName('Email')]: email
            };
        });
        console.log('Processing format data section!');

    }

    cleanData() {
        this.cleanedUserData = this.formattedUserData.map(user => {
            //
            let { title, first_name, middle_name, surname, date_of_birth, age, email } = user;

            //
            title = this.cleanTitle(title);
            first_name = this.cleanName(first_name);
            middle_name = this.cleanName(middle_name);
            surname = this.cleanName(surname);
            date_of_birth = this.cleanDateOfBirth(date_of_birth);
            age = this.cleanAge(date_of_birth, age);
            email = this.cleanEmail(email, first_name, surname);

            return { title, first_name, middle_name, surname, date_of_birth, age, email };
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

// Demonstration of using the class
const dataProcessor = new DataProcessing();
dataProcessor.loadCSV("Raw_User_Data").then(() => {
    // Format and clean data after loading
    dataProcessor.formatData();
    dataProcessor.saveFormattedDataToFile("./formattedUserData.json");
    dataProcessor.cleanData();
});
