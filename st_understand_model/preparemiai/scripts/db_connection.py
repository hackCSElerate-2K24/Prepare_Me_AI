import pymysql

def get_db_connection():
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='root',  # Update with your MySQL password
        database='prepareme',
        charset='utf8',
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection
