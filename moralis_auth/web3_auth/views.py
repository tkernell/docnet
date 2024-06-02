import json
import requests

from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from datetime import datetime, timedelta, timezone

API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjIwMjcyMzFiLTU1ODQtNDdjMC1iMzRlLWFmMGQ2ODkyOTVhNSIsIm9yZ0lkIjoiMzk0NTY3IiwidXNlcklkIjoiNDA1NDQ1IiwidHlwZUlkIjoiODM2MThiYmEtYjE3Ny00MTRiLThlYTQtMzFlNDQ1ODkxZGEyIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTcyNTAyMTYsImV4cCI6NDg3MzAxMDIxNn0.HL8s-NDIcq0uJ9CfIaplDsIiNY6CKAtvWBAfzZ0VwyU'
# this is a check to make sure the API key was set
# you have to set the API key only in line 9 above
# you don't have to change the next line
# if API_KEY == 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjIwMjcyMzFiLTU1ODQtNDdjMC1iMzRlLWFmMGQ2ODkyOTVhNSIsIm9yZ0lkIjoiMzk0NTY3IiwidXNlcklkIjoiNDA1NDQ1IiwidHlwZUlkIjoiODM2MThiYmEtYjE3Ny00MTRiLThlYTQtMzFlNDQ1ODkxZGEyIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTcyNTAyMTYsImV4cCI6NDg3MzAxMDIxNn0.HL8s-NDIcq0uJ9CfIaplDsIiNY6CKAtvWBAfzZ0VwyU':
#     print("API key is not set")
#     raise SystemExit

from django.db import connections, transaction
from django.core.cache import cache # This is the memcache cache.

from django.shortcuts import render, redirect
from django.contrib.auth import logout as auth_logout
from django.core.cache import cache
from django.db import connections, transaction

def flush(request):
    # Log the user out
    auth_logout(request)
    
    # Clear the Django cache
    cache.clear()
    
    return redirect('moralis_auth')



def start(request):
    return render(request, 'start.html', {})

def moralis_auth(request):
    return render(request, 'login.html', {})

def my_profile(request):
    return render(request, 'profile.html', {})

def request_message(request):
    data = json.loads(request.body)
    print(data)

    #setting request expiration time to 1 minute after the present->
    present = datetime.now(timezone.utc)
    present_plus_one_m = present + timedelta(minutes=1)
    expirationTime = str(present_plus_one_m.isoformat())
    expirationTime = str(expirationTime[:-6]) + 'Z'

    REQUEST_URL = 'https://authapi.moralis.io/challenge/request/evm'
    request_object = {
      "domain": "defi.finance",
      "chainId": 1,
      "address": data['address'],
      "statement": "Please confirm",
      "uri": "https://defi.finance/",
      "expirationTime": expirationTime,
      "notBefore": "2020-01-01T00:00:00.000Z",
      "timeout": 15
    }
    x = requests.post(
        REQUEST_URL,
        json=request_object,
        headers={'X-API-KEY': API_KEY})

    return JsonResponse(json.loads(x.text))


def verify_message(request):
    data = json.loads(request.body)
    print(data)

    REQUEST_URL = 'https://authapi.moralis.io/challenge/verify/evm'
    x = requests.post(
        REQUEST_URL,
        json=data,
        headers={'X-API-KEY': API_KEY})
    print(json.loads(x.text))
    print(x.status_code)
    if x.status_code == 201:
        # user can authenticate
        eth_address=json.loads(x.text).get('address')
        print("eth address", eth_address)
        try:
            user = User.objects.get(username=eth_address)
        except User.DoesNotExist:
            user = User(username=eth_address)
            user.is_staff = False
            user.is_superuser = False
            user.save()
        if user is not None:
            if user.is_active:
                login(request, user)
                request.session['auth_info'] = data
                request.session['verified_data'] = json.loads(x.text)
                return JsonResponse({'user': user.username})
            else:
                return JsonResponse({'error': 'account disabled'})
    else:
        return JsonResponse(json.loads(x.text))