const fss = require('fs')
const fs = require('fs').promises

function calculate_age(date_of_birth, current_date = new Date()) {
    const birthDate = new Date(date_of_birth);
    let age = current_date.getFullYear() - birthDate.getFullYear();
    const m = current_date.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && current_date.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
function wordToNumber(word) {
    const numWords = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
        "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
        "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
        "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40,
        "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80,
        "ninety": 90
    };

    let number = 0;
    if (word.indexOf("-") !== -1) {
        word.split("-").forEach(part => {
            number += numWords[part];
        });
    } else {
        number = numWords[word] || "Unknown";
    }

    return number;
}
function convertDateOfBirth(dateOfBirth, providedAge) {
    const monthMap = {
        "January": "01",
        "February": "02",
        "March": "03",
        "April": "04",
        "May": "05",
        "June": "06",
        "July": "07",
        "August": "08",
        "September": "09",
        "October": "10",
        "November": "11",
        "December": "12"
    };
    providedAge = isNaN(providedAge) && typeof providedAge === 'string' ? wordToNumber(providedAge.toLowerCase()) : providedAge;

    // 如果没有提供年龄或年龄是文本形式，尝试根据出生日期计算
    if (!providedAge || providedAge === "Unknown") {
        const birthDate = new Date(`${year}-${month}-${day}`);
        providedAge = calculate_age(birthDate);
    }
    if (typeof dateOfBirth !== 'string') {
        console.error('Invalid dateOfBirth:', dateOfBirth);
        return { date: '01/01/1900', age: 'Unknown' };
    }

    let parts = dateOfBirth.includes('/') ? dateOfBirth.split('/') : dateOfBirth.split(' ');
    let month, day, year;

    if (isNaN(parts[1])) { // 月份为单词
        month = monthMap[parts[1]];
        day = parts[0].padStart(2, '0');
        year = parts[2];
    } else { // 月份为数字
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
    }

    // 处理两位数年份
    if (year.length === 2) {
        const currentYear = new Date().getFullYear();
        const currentYearLastTwoDigits = parseInt(currentYear.toString().slice(-2), 10);
        const guessedCentury = (parseInt(year) > currentYearLastTwoDigits) ? '19' : '20';
        year = guessedCentury + year;
    }

    // 根据完整年份重新组装出生日期以便计算年龄
    dateOfBirth = `${day}/${month}/${year}`;

    // 如果没有提供年龄，则根据出生日期计算
    let age = providedAge;
    if (!age) {
        age = calculate_age(`${year}-${month}-${day}`);
    }

    return { date: dateOfBirth, corrected_age: age.toString() };
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
        this.rawUserData = this.raw_user_data.split('\n').filter(Boolean).map(row => row.split(','));
        this.formatted_user_data = this.rawUserData.map(row => {
            const [fullName, dateOfBirth, age, email] = row.map(item => item.trim());
            const validTitles = ["Mr", "Mrs", "Miss", "Ms", "Dr", "Dr."];

            const nameParts = fullName.split(' ').filter(Boolean);
            let title = "";
            let firstName = '';
            let middleName = '';
            let surname = '';


            if (validTitles.includes(nameParts[0])) {
                title = nameParts.shift();
            }

            if (nameParts.length >= 1) {
                firstName = nameParts[0];
            }
            if (nameParts.length >= 2) {
                surname = nameParts[nameParts.length - 1];
            }
            if (nameParts.length > 2) {
                middleName = nameParts.slice(1, -1).join(' ');
            }


            const { date: correctedDateOfBirth, corrected_age: true_age } = convertDateOfBirth(dateOfBirth, age);

            return {
                title: title, // 可能为空
                first_name: firstName,
                middle_name: middleName,
                surname: surname,
                date_of_birth: correctedDateOfBirth,
                age: Number(true_age),
                email: email
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
// //
// const dataProcessor = new Data_Processing();
//
// // 直接按顺序执行方法
// dataProcessor.load_CSV("Raw_User_Data");
// dataProcessor.format_data();
// //dataProcessor.cleanData();
// dataProcessor.saveFormattedDataToFile("./formattedUserData.json");