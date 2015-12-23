from flask import Flask,make_response,render_template, request, jsonify, json
import os
from flask_restful import reqparse, abort, Api, Resource
from flask.ext.assets import Bundle, Environment
import sqlite3

port = int(os.getenv('PORT', 8000))

app = Flask(__name__)
api = Api(app)
assets = Environment(app)

js = Bundle(
    'js/jquery.js',
    'js/bootstrap.min.js',
    'js/chart.js',
    'js/toolkit.js',
    'js/application.js',
    'js/jquery.stickytableheaders.min.js',
    'js/doj.js',
    filters='rjsmin',
    output='js/libs.js'
)
assets.register('js_libs', js)

css = Bundle(
    'css/bootstrap.min.css',
    'css/style.scss.css',
    'css/toolkit-inverse.css',
    'css/application.css',
    'css/ball.css',
    'css/font-awesome.min.css',
    filters='cssmin',
    output='css/min.css'
)
assets.register('css_all', css)



class addStudent(Resource):
    def post(self):
        conn = sqlite3.connect('data.db', timeout=1)
        if not request.json:
            abort(400)
        content =request.get_json(force=True)
        print content
        name=content['name']
        collegeid=content['collegeid']
        print name,collegeid
        try:
            query="insert into students(name,clg) values('{}',{} )".format(name,collegeid)
            with conn:
                conn.execute(query)
        except Exception, e:
            raise e
        # query="select id,name,status from students where clg={}".format(collegeid)
        # data=conn.execute(query).fetchall()
        # students=[{"id":i[0],"name":i[1],"status":i[2]} for i in data]
        # return {'students':students}
        return {"msg":"ok"}

        

class Students(Resource):
    def get(self,collegeid):
        conn = sqlite3.connect('data.db', timeout=1)
        query="select id,name,status from students where clg={}".format(collegeid)
        data=conn.execute(query).fetchall()
        students=[{"id":i[0],"name":i[1],"status":i[2]} for i in data]
        return {'students':students}

    def post(self):
        conn = sqlite3.connect('data.db', timeout=1)
        if not request.json:
            abort(400)
        content =request.get_json(force=True) #request.json
        #print content
        for item in content:
            try:
                query="update students set status='{}' where id={}".format(item['status'],item['id'])
                with conn:
                    conn.execute(query)
            except Exception, e:
                raise e
            
        return {"msg":"ok"}

        

class College(Resource):
    def get(self):
        conn = sqlite3.connect('data.db', timeout=1)
        query="select c.id,c.name,(select count(s.id) from students s where c.id=s.clg),(select count(s.id) from students s where c.id=s.clg and s.status='Unknown'),(select count(s.id) from students s where c.id=s.clg and s.status='Waiting') ,(select count(s.id) from students s where c.id=s.clg and s.status='Joined') ,(select count(s.id) from students s where c.id=s.clg and s.status='NotJoining')  from colleges c "
        data=conn.execute(query).fetchall()
        colleges=[{"id":i[0],"name":i[1], "total":i[2],"unknown": i[3],"waiting": i[4],"joined":i[5],"notjoining":i[6]} for i in data]
        return {'colleges':colleges}     

@app.route('/')
def index():
        headers = {'Content-Type': 'text/html'}
        conn = sqlite3.connect('data.db', timeout=1)
        query="select (select count(s.id) from students s) as total,(select count(s.id) from students s where  s.status='Unknown') as unknown,(select count(s.id) from students s where s.status='Waiting') as waiting,(select count(s.id) from students s where  s.status='Joined') as joined,(select count(s.id) from students s where  s.status='NotJoining') as notjoining "
        data=conn.execute(query).fetchone()
        #print data
        return make_response(render_template('index.html',data=data),200,headers)
routes = [
    '/students/<collegeid>',
   '/students/'
]
api.add_resource(College, '/college/')
api.add_resource(Students, *routes)
api.add_resource(addStudent, '/addStudent/')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(port))
