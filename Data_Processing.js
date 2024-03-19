const fss = require('fs')
const fs = require('fs').promises

// Convert those ages with words to bits
function word_number_to_bit(word) {
    const number_word_map = {
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
            number += number_word_map[part];
        });
    } else {
        number = number_word_map[word];
    }

    return number;
}

// Convert those months using words to digits
function convert_month_date(date_of_birth, input_age) {
    const month_map = {
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
    input_age = isNaN(input_age) && typeof input_age === 'string' ? word_number_to_bit(input_age.toLowerCase()) : input_age;

    if (typeof date_of_birth !== 'string') {
        console.error('Invalid dateOfBirth:', date_of_birth);
    }

    let date_parts = date_of_birth.includes('/') ? date_of_birth.split('/') : date_of_birth.split(' ');
    let month, day, year;

    if (isNaN(date_parts[1])) {
        month = month_map[date_parts[1]];
        day = date_parts[0].padStart(2, '0');
        year = date_parts[2];
    } else {
        day = date_parts[0].padStart(2, '0');
        month = date_parts[1].padStart(2, '0');
        year = date_parts[2];
    }


    if (year.length === 2) {
        const current_year = new Date().getFullYear();
        const last_two_digits = parseInt(current_year.toString().slice(-2), 10);
        const first_two_digits = (parseInt(year) > last_two_digits) ? '19' : '20';
        year = first_two_digits + year;
    }

    date_of_birth = `${day}/${month}/${year}`;

    let age = input_age;
    return {date: date_of_birth, corrected_age: age.toString()};
}

function cleanEmail(firstName, surname, nameCounter) {

    const baseName = `${firstName}.${surname}`;
    const baseEmail = `${baseName}@example.com`;

    const totalOccurrences = nameCounter[baseName] || 0;
    if (totalOccurrences > 1) {
        if (!cleanEmail.emailNumbers) {
            cleanEmail.emailNumbers = {};
        }
        const currentNumber = (cleanEmail.emailNumbers[baseName] || 0) + 1;
        cleanEmail.emailNumbers[baseName] = currentNumber;
        return `${baseName}${currentNumber}@example.com`;
    } else {
        return baseEmail;
    }
}








class Data_Processing {
    constructor() {
        this.raw_user_data = "";
        this.formatted_user_data = [];
        this.cleaned_user_data = [];
    }

    // Load data from csv
    load_CSV(filename) {
        this.raw_user_data = fss.readFileSync(`${filename}.csv`, 'utf8');
    }

    // Save formatted data to json file
    save_formatted_data(file_path) {
        try {
            //
            const data = JSON.stringify(this.formatted_user_data, null, 2);
            //
            fs.writeFile(file_path, data, 'utf-8');
            console.log('Data saved to file successfully.');
        } catch (error) {
            console.error('Failed to save data to file:', error);
        }
    }

    //Main method for formatting data
    format_data() {
        this.split_raw_user_data = this.raw_user_data.split('\n').filter(Boolean).map(row => row.split(','));
        this.formatted_user_data = this.split_raw_user_data.map(row => {
            const [full_name, date_of_birth, age, email] = row.map(item => item.trim());
            const titles = ["Mr", "Mrs", "Miss", "Ms", "Dr", "Dr."];

            const parts_of_names = full_name.split(' ').filter(Boolean);
            let title = "";
            let first_name = '';
            let middle_name = '';
            let sur_name = '';


            if (titles.includes(parts_of_names[0])) {
                title = parts_of_names.shift();
            }

            if (parts_of_names.length >= 1) {
                first_name = parts_of_names[0];
            }
            if (parts_of_names.length >= 2) {
                sur_name = parts_of_names[parts_of_names.length - 1];
            }
            if (parts_of_names.length > 2) {
                middle_name = parts_of_names.slice(1, -1).join(' ');
            }


            const {date: corrected_birth, corrected_age: true_age} = convert_month_date(date_of_birth, age);

            return {
                title: title,
                first_name: first_name,
                middle_name: middle_name,
                surname: sur_name,
                date_of_birth: corrected_birth,
                age: Number(true_age),
                email: email
            };
        });
    }


    clean_data() {
        // First, remove duplicates
        const usr_map = new Map();
        const uniqueUsers = this.formatted_user_data.filter(user => {
            const {title, first_name, middle_name, surname, date_of_birth, age} = user;
            const usr_key = `${title}-${first_name}-${middle_name}-${surname}-${date_of_birth}-${age}`;

            if (usr_map.has(usr_key)) {
                return false;
            } else {
                usr_map.set(usr_key, true);
                return true;
            }
        });

        // Second, clean title, first_name, surname, age
        this.cleaned_user_data = uniqueUsers.map(user => {
            let {title, first_name, middle_name, surname, date_of_birth, age, email} = user;

            title = this.clean_title(title);
            first_name = this.clean_first_name(first_name, email);
            surname = this.clean_sur_name(surname, email);
            age = this.clean_age(date_of_birth);
            return {title, first_name, middle_name, surname, date_of_birth, age, email};
        });

        //Then can do clean email, because if not cleaned others data, there maybe lack of names
        const nameCounter = {};
        this.cleaned_user_data.forEach(({first_name, surname}) => {
            const baseName = `${first_name}.${surname}`;
            nameCounter[baseName] = (nameCounter[baseName] || 0) + 1;
        });

        // Then clean email
        this.cleaned_user_data = this.cleaned_user_data.map(user => {
            let {title, first_name, middle_name, surname, date_of_birth, age, email} = user;
            email = cleanEmail(first_name, surname, nameCounter);
            return {title, first_name, middle_name, surname, date_of_birth, age, email};
        });

    }



    clean_title(title) {
        title = title.replace("Dr.", "Dr");
        const titles = ["Mr", "Mrs", "Miss", "Ms", "Dr"];
        return titles.includes(title) ? title : "";
    }

    clean_first_name(name, email) {
        if (name) return name;
        const email_part = email.split('@')[0].split('.');
        return email_part[0];
    }


    clean_sur_name(name, email) {
        if (name) return name;
        const email_part = email.split('@')[0].split('.');
        let sur_name_maybe_with_bit = email_part.length > 1 ? email_part[1] : "";
        const sur_name = sur_name_maybe_with_bit.replace(/[0-9]/g, '');
        return sur_name;
    }


    clean_age(date_of_birth) {
        const collected_date = new Date(2024, 1, 26); // JavaScript中月份是从0开始的，所以1代表二月
        const birth_dat_part = date_of_birth.split('/');
        const birth_date = new Date(parseInt(birth_dat_part[2], 10), parseInt(birth_dat_part[1], 10) - 1, parseInt(birth_dat_part[0], 10));

        let age_year = collected_date.getFullYear() - birth_date.getFullYear();
        const month = collected_date.getMonth() - birth_date.getMonth();
        // Check if reached birthday
        if (month < 0 || (month === 0 && collected_date.getDate() < birth_date.getDate())) {
            age_year--;
        }

        return age_year;
    }


}

// //
// const dataProcessor = new Data_Processing();
//
// // 直接按顺序执行方法
// dataProcessor.load_CSV("Raw_User_Data");
// dataProcessor.format_data();
// dataProcessor.clean_data();
// dataProcessor.save_formatted_data("./formattedUserData.json");