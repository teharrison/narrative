"""
Common narrative logging functions
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '1/30/14'

import logging
import os
log_to_mongo = False
try:
    import pymongo
    from mongolog.handlers import MongoHandler
    log_to_mongo = True
except:
    pass

class Mongo(object):
    host = 'localhost'
    port = 27017
    user = 'narrative'
    password = 'letm3in'
    db = 'logging'
    collection = 'narrative'

_log = logging.getLogger("biokbase")  # root of hierarchy

# Turn on debugging by setting environment variable KBASE_DEBUG.
if os.environ.get("KBASE_DEBUG", None):
    _log.setLevel(logging.DEBUG)
else:
    _log.setLevel(logging.WARN)

# Set default log handler.
_h = logging.StreamHandler()
_h.setFormatter(logging.Formatter("%(levelname)s %(asctime)s %(module)s: %(message)s"))
_log.addHandler(_h)

# If mongo is available, add that one too
if log_to_mongo:
    try:
        # make sure we can connect
        client = pymongo.MongoClient(host=Mongo.host, port=Mongo.port)
        db = client[Mongo.db]
        db.authenticate(Mongo.user, Mongo.password)
        del db, client
        # add handler
        _log.addHandler(MongoHandler.to(db=Mongo.db, collection=Mongo.collection,
                                        host=Mongo.host, port=Mongo.port,
                                        user=Mongo.user, password=Mongo.password))
    except pymongo.errors.PyMongoError, err:
        _log.info("Could not connect to to MongoDB for logging: {}".format(err))

