/**
 * Deepwoods Green Task Management - Google Apps Script Backend
 * 
 * Paste this script into your Google Apps Script Editor (Extensions -> Apps Script in Google Sheets).
 * Deploy as a Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 */

const LOGO_BASE64_DATA = "iVBORw0KGgoAAAANSUhEUgAAAQQAAABPCAYAAAAN4LsRAAAKMWlDQ1BJQ0MgUHJvZmlsZQAAeJydlndUU9kWh8+9N71QkhCKlNBraFICSA29SJEuKjEJEErAkAAiNkRUcERRkaYIMijggKNDkbEiioUBUbHrBBlE1HFwFBuWSWStGd+8ee/Nm98f935rn73P3Wfvfda6AJD8gwXCTFgJgAyhWBTh58WIjYtnYAcBDPAAA2wA4HCzs0IW+EYCmQJ82IxsmRP4F726DiD5+yrTP4zBAP+flLlZIjEAUJiM5/L42VwZF8k4PVecJbdPyZi2NE3OMErOIlmCMlaTc/IsW3z2mWUPOfMyhDwZy3PO4mXw5Nwn4405Er6MkWAZF+cI+LkyviZjg3RJhkDGb+SxGXxONgAoktwu5nNTZGwtY5IoMoIt43kA4EjJX/DSL1jMzxPLD8XOzFouEiSniBkmXFOGjZMTi+HPz03ni8XMMA43jSPiMdiZGVkc4XIAZs/8WRR5bRmyIjvYODk4MG0tbb4o1H9d/JuS93aWXoR/7hlEH/jD9ld+mQ0AsKZltdn6h21pFQBd6wFQu/2HzWAvAIqyvnUOfXEeunxeUsTiLGcrq9zcXEsBn2spL+jv+p8Of0NffM9Svt3v5WF485M4knQxQ143bmZ6pkTEyM7icPkM5p+H+B8H/nUeFhH8JL6IL5RFRMumTCBMlrVbyBOIBZlChkD4n5r4D8P+pNm5lona+BHQllgCpSEaQH4eACgqESAJe2Qr0O99C8ZHA/nNi9GZmJ37z4L+fVe4TP7IFiR/jmNHRDK4ElHO7Jr8WgI0IABFQAPqQBvoAxPABLbAEbgAD+ADAkEoiARxYDHgghSQAUQgFxSAtaAYlIKtYCeoBnWgETSDNnAYdIFj4DQ4By6By2AE3AFSMA6egCnwCsxAEISFyBAVUod0IEPIHLKFWJAb5AMFQxFQHJQIJUNCSAIVQOugUqgcqobqoWboW+godBq6AA1Dt6BRaBL6FXoHIzAJpsFasBFsBbNgTzgIjoQXwcnwMjgfLoK3wJVwA3wQ7oRPw5fgEVgKP4GnEYAQETqiizARFsJGQpF4JAkRIauQEqQCaUDakB6kH7mKSJGnyFsUBkVFMVBMlAvKHxWF4qKWoVahNqOqUQdQnag+1FXUKGoK9RFNRmuizdHO6AB0LDoZnYsuRlegm9Ad6LPoEfQ4+hUGg6FjjDGOGH9MHCYVswKzGbMb0445hRnGjGGmsVisOtYc64oNxXKwYmwxtgp7EHsSewU7jn2DI+J0cLY4X1w8TogrxFXgWnAncFdwE7gZvBLeEO+MD8Xz8MvxZfhGfA9+CD+OnyEoE4wJroRIQiphLaGS0EY4S7hLeEEkEvWITsRwooC4hlhJPEQ8TxwlviVRSGYkNimBJCFtIe0nnSLdIr0gk8lGZA9yPFlM3kJuJp8h3ye/UaAqWCoEKPAUVivUKHQqXFF4pohXNFT0VFysmK9YoXhEcUjxqRJeyUiJrcRRWqVUo3RU6YbStDJV2UY5VDlDebNyi/IF5UcULMWI4kPhUYoo+yhnKGNUhKpPZVO51HXURupZ6jgNQzOmBdBSaaW0b2iDtCkVioqdSrRKnkqNynEVKR2hG9ED6On0Mvph+nX6O1UtVU9Vvuom1TbVK6qv1eaoeajx1UrU2tVG1N6pM9R91NPUt6l3qd/TQGmYaYRr5Grs0Tir8XQObY7LHO6ckjmH59zWhDXNNCM0V2ju0xzQnNbS1vLTytKq0jqj9VSbru2hnaq9Q/uE9qQOVcdNR6CzQ+ekzmOGCsOTkc6oZPQxpnQ1df11Jbr1uoO6M3rGelF6hXrtevf0Cfos/ST9Hfq9+lMGOgYhBgUGrQa3DfGGLMMUw12G/YavjYyNYow2GHUZPTJWMw4wzjduNb5rQjZxN1lm0mByzRRjyjJNM91tetkMNrM3SzGrMRsyh80dzAXmu82HLdAWThZCiwaLG0wS05OZw2xljlrSLYMtCy27LJ9ZGVjFW22z6rf6aG1vnW7daH3HhmITaFNo02Pzq62ZLde2xvbaXPJc37mr53bPfW5nbse322N3055qH2K/wb7X/oODo4PIoc1h0tHAMdGx1vEGi8YKY21mnXdCO3k5rXY65vTW2cFZ7HzY+RcXpkuaS4vLo3nG8/jzGueNueq5clzrXaVuDLdEt71uUnddd457g/sDD30PnkeTx4SnqWeq50HPZ17WXiKvDq/XbGf2SvYpb8Tbz7vEe9CH4hPlU+1z31fPN9m31XfKz95vhd8pf7R/kP82/xsBWgHcgOaAqUDHwJWBfUGkoAVB1UEPgs2CRcE9IXBIYMj2kLvzDecL53eFgtCA0O2h98KMw5aFfR+OCQ8Lrwl/GGETURDRv4C6YMmClgWvIr0iyyLvRJlESaJ6oxWjE6Kbo1/HeMeUx0hjrWJXxl6K04gTxHXHY+Oj45vipxf6LNy5cDzBPqE44foi40V5iy4s1licvvj4EsUlnCVHEtGJMYktie85oZwGzvTSgKW1S6e4bO4u7hOeB28Hb5Lvyi/nTyS5JpUnPUp2Td6ePJninlKR8lTAFlQLnqf6p9alvk4LTduf9ik9Jr09A5eRmHFUSBGmCfsytTPzMoezzLOKs6TLnJftXDYlChI1ZUPZi7K7xTTZz9SAxESyXjKa45ZTk/MmNzr3SJ5ynjBvYLnZ8k3LJ/J9879egVrBXdFboFuwtmB0pefK+lXQqqWrelfrry5aPb7Gb82BtYS1aWt/KLQuLC98uS5mXU+RVtGaorH1futbixWKRcU3NrhsqNuI2ijYOLhp7qaqTR9LeCUXS61LK0rfb+ZuvviVzVeVX33akrRlsMyhbM9WzFbh1uvb3LcdKFcuzy8f2x6yvXMHY0fJjpc7l+y8UGFXUbeLsEuyS1oZXNldZVC1tep9dUr1SI1XTXutZu2m2te7ebuv7PHY01anVVda926vYO/Ner/6zgajhop9mH05+x42Rjf2f836urlJo6m06cN+4X7pgYgDfc2Ozc0tmi1lrXCrpHXyYMLBy994f9Pdxmyrb6e3lx4ChySHHn+b+O31w0GHe4+wjrR9Z/hdbQe1o6QT6lzeOdWV0iXtjusePhp4tLfHpafje8vv9x/TPVZzXOV42QnCiaITn07mn5w+lXXq6enk02O9S3rvnIk9c60vvG/wbNDZ8+d8z53p9+w/ed71/LELzheOXmRd7LrkcKlzwH6g4wf7HzoGHQY7hxyHui87Xe4Znjd84or7ldNXva+euxZw7dLI/JHh61HXb95IuCG9ybv56Fb6ree3c27P3FlzF3235J7SvYr7mvcbfjT9sV3qID0+6j068GDBgztj3LEnP2X/9H686CH5YcWEzkTzI9tHxyZ9Jy8/Xvh4/EnWk5mnxT8r/1z7zOTZd794/DIwFTs1/lz0/NOvm1+ov9j/0u5l73TY9P1XGa9mXpe8UX9z4C3rbf+7mHcTM7nvse8rP5h+6PkY9PHup4xPn34D94Tz+6TMXDkAACoYSURBVHja7X15nBTVtf/3nFvVPT0DCAKCivJEGLqrGdSQGIwxuIZEozGJonGJ0ajZNMvL9jTbM4smRk3c4jMmJjEYF3xxjfsS1IhKxjyW6e4BgkFZRDZhmJnuqrrn/P7obhiG7pkemCGQX30/n/p8mKb73qpb537v2e65QIQIESJEiBAhQoQIESJEiBAhQoQIESJEiBAhQoQIESLsFCgagggR9nxMmDBh/7jjvAdEDVZ1STabfRWARoQQIcL/Z0inUp8B9EgifkGANkAOAbCfCL6Ty+VW9aUtjoYzwu4AVdD1j34oHo1E35BKpT6qpJPBuJuIRgJyMJE8bpTuMkRXeZ4Xiwghwh6FG//8nsabn33fw+y+c/etf5viRiNSG6ZNm+YQ4eOJvP89KE5SlaMY/DaEf2WJNqnqmwDeHxFChD0GNz1zxLmccF9wY3RSrM6c6q93vxuNSm1Yt27dcECD5qVLN0KJVdEK5kcV2EBkDyCjrwI2HRFChN0e1z86Pn7TU0f8nJnuIMI+fl4QFATs0GU3PTX1QwNpmqxdtP+YVUtGHbv+9dFfeDO3z+Q9dQxFJCAlU/rTJ6aPqNhHiCgcMWL0g6q0Nwl1RoQQYbfGz+8/ZKhxR9zt1vFXxCpsIKFCVwIAMzlKdPP1z79/ZH/1t2LFvvWrlow69q3Fo69evWSfOQHCBQZ4pr6BbmbCxXvqOGYymQ1Kmm+aOHGikoqK3usH4amA8vqVKw8E8AEhmtOXNp1IPCPsStz2+NS9Cw5muXFzrJ8XMBMUeAuqq9ih/cJAEavjcX4+/DGwc5N1RW7fJDtyDnXIJ4iQjMeB0DJEFGEIbG5XkNIRqjBEsHvgcCqz3CLgH7DgjkDl74sXL17ZlEx+1brmcgBLstlsS18ajMKOEXYZfv3i+wZ35vVPsTgf7+eluCK5jDCQJ1Wxl+PSe22oIAKYEYYBpn9p+pxn+9rP8taRh8aYvyLQ0+ri3BAEitACqoDjAGGIlVA0OA72CkJshsvp/Q9e9caeOq5NyeQUIbqIiPJKKqQ6RKBzM5nW2wBIRAgRdjt8/7lpzoigMDOecM4IQ4EIoKJwY4xC3l7LjOnG8CRrFcYQ2CH4eTtXw6FHffnExwu19PH6wpGjEzG6nAificW5vqND1XFAtrT2OwYILd6CYo5x8FGxYMclBD4+vF/yrcf39DH2PO9AVY27rrty/vz57TvSxk6ZDE1N48eIxMcCQS3co6qmg4jWFQqFt5csWVLoY3dm0qSJh6k68dr66wkuVDUYOXLka7Nnzw63Pk/TMBHxdr79Yh/W2jW5XG5R108nT57cYG3hEEBrImMREzLzpiAI1ixatGhtLwLhEdGwrvdPhLZ4fHC2ubm5lofiZDJ5OID13e+7hz73JqKDgdC1loSIlIg0DMOlXe93ROh/J5ZwzvAL1hfRZiIkY3VmmA0VDFoE6OnEBAYQWvk/sjQmnjDvyec3ng3g9t7u483syE/EXPpZPMYH5QuKIAAAnWstOXVxelfBVyhgCXIriD8DgBUljSHQJgCPA8D48eNHxuPxxlpl2lrKq+r6YcOGrX755Zc7d1ZqpkyZ4nZ0dDQaIC2k40hphJK6pNquRCtUKWeMWbhw4cLVFXwKO63l7BQhhKE5zzH4kYipUR1RgermmOuuSKdTr4rggfr6+iebm5s7ahC8hFi5n1nHqJqdemgihaqsXb16dRLAuq3PEx5hmP68s+0XnWMACH8EcPa2YxZOIPCLtWpnTADE+o4xG7xUagkTPUnW3rOgtbW1AuV+nJl+2PV9qCLs7Ox4JZVKnZ/NZhf31Fc6PfEDBH5OVRdNnjz5Xb2tMulk8kwi/amqHggwTMlFrdCAmacCWAsA1z8+9UPM+HZQsGCmGKCA6ilhoNMl1IuE7WqC2UtEl6mVz6ngeCdGl4pVkOq3bnpu2r2XHDN7c6V7WLgQseGxUT9mxteYQR2duuUdAzgIRKf7vtw8aBCn29rkdyAalojTmM68lm8WCk2V24vFzAkEvbNWGTAMhaK9bdM7q9Je8u8KfsgY8+iCBQs29EVeGhsbR8Qc58J8R8cZDPXAHDO0vc9fVaFi13he6nki+f2IEa2PzZ6NsL+0jJ2NMugO9DeEmVJMfJ5huj/f2THH87yzBqi/vrbVn+3333MQxZhpFDMdSUxXiDGvplOpK8dMHZPYRpsA7hGR7quUY5iPJMJt06ZN63EBUOUvERGYuDEMw1N7Jo8JKWX6NUAHbnurBChezeVy88pORDJ0IxtyVAFrFW7MHAHiH3Us3/wTJdwPcToBHWStLBGltBvjr4nVWNHBaBrFFs6odA9rF+09ZHhs1N2JBH1dZKtpAADWAvX1PFJFJoSq53R06mIm3MOg8xRAPE5wHUAUUOCgrrTa1/UFRIOIeAIzz2DCTLXhXM9LfnHKlNqSrFKp1PGu67xETFcR06EgiqkqRGS7S1VBRCMN8ycI5qG1a1JPp1Kpo3YXQtix2VB62NLDTWbCnelU6s6mpqZhvTg8FP8e0B0Zs/K4ATqEDV82ZOPgezzPG1T+TlED0OeYqJvZISDgA+tWr35PVfNv4sQmAj4sIlAoAL2kRwIR5zzD3KCq6E4IDMwEil77ToPL6up4fBhs/Z5fELgxnhYf3fAIoHGCtENJCDiSCNeIVaiWXrgoILjk3oXbpuCuyQ4fHKh7byJBH+voUBQXTl3BvC0pKHA2CR/lF/RnoeCURD3t1dGhf+0s6INhqHNFNCRg9MKFfUvxrSzTxXcEooMNm5sKnR2PeJ53YC9k8GEmPEDAhPKc6OP8mcZET6VTqe+MGbPtArHHEEIlQWfDZ4kNHkwmk8N3Rb9E1N7Q0NA5wL2sH6iWRQTG8Mmkel03ppmpFU0YJiGaUbU9Q19g5rryO2Gi965bvfqYSt+dOnVMAoRTKwmvWLs+EHkIAG54/IikIfqc7ytAgHEIZa7yC4K6BB8NRVKZOgBlZqorG1LGIUC0EAYKx+FDV60YenS5j+eegxOwuS1RT9M7Oor34DogUfqnCB5I1BUbCQJFzKUjQfohJ0ZzXAfnt2/WFYbxn47RZmIaogKjoKFDsGlQfy94xPxBhj7e1DRhXKXvTZw4cT8m/IaIGmohgmp9ARo3jvnhkCENZ+62hEBEYOZtLiIqqpRVBJzZHGUIt9eqavXUV09XSa39Qy2+ix3tQ1U2k+of++M5ehozYrqwKZU6fotNa9zHVXVl99+UBOeUrhrFtt5pnFnUPrbcCwnRpZX63bRpyBFE1NhdiLnoOHm8tbV1JQCQwVecOA8qGeqrbKCvKmDdOIMIsAIQ0OaQWAKoGBakkqtFHgLTG8RlItFPbbG39xv1jUSCzyiTAQCEFnBjOBwiMzvz+mQiQVAFmMkl8E0a4pN1ddygwGBRPBV3+QfMmCgKgqKeYlo/EDJNzCkbOnePGzdur+38D4YuZOZ9K5FBX/oiIlhrm0XooX+pU7EH1gqheq8CbVs+IzJQjCbSJiIeu1VIu5GCMad0dHR8HsANtU4iVV2oKi9Ce3PUEUBUAMkcL9s0qwXZ2p9J5CElrKypD8Z6gO9vybXM7QsZiOgcgi7SksOxaCKpC8LBAB1eyRFJRGShXwbwNAAsWLBgg+clH2Liz3UdX1UFM4+zokcBeKybM/ICNmZoV0IoCjOmp1Kpw7LZ7N+7ff8MYqbu709VIUVzAbc8PXX/UHVG6CtUAGMwUlRfsSH9LAxkBhFOcWMcD33boYFj1VjE4gwb6HxRuZLAZxtDE2yoCAMFQT946aMfGvLtca/9Bxn9ju93HYNijoFryA2ZL1RrzsoX7FODGuiwTe3youPiNRvgd/k8wIwhREDZqVg0MTSGoNCrui2q95PK6q0yQKyEEQSdRMQTqsm0MfyeRDz+PQBf29ZfTB+uRgaimoPq4yS6jIhESEcBNJmAw4lon3JfJfnfpKALc7nsut2SEAAUlPhrmUzmre7/ccghhwy1vv8RBb5PTOMrCRVBL580adI9lUIrVSbS05ls7qt9ucEW5PqwcgMkuGpBNvfyQGpUULm1JZf7fSVNLp1KnQ7C7QDquwscoO9PJpP7bt37zneKyMXdNcCifa9ndCWEpqamYTYMLqgkmEwcU7JfBHBh1/cXBP5JlXwHqrK4vn7jbAAILH00nuBhfkHK9rzjxs2pRDKcrPm0RfhDPx/+BEqkjh8QHPJ9ucmE+CEZvjEW45PLvxVRODEzciw2HW1Yz3ZcU9+ZVzADYnW5gkYRwS34CsdgeqhBCiF/3PexkBTX2BCnDGrgfQq+wnUJTEAYKoJwy5xi4zg1zAX6QUsm+3/dP508eXJDGBaOI/D3iGhKJVIA4fOpVOr2cubguHHjBgM4sIo8zzWOM71SpCKZTO5rjH5MlS4mYCKA1ST61Zbc9ve1W5kM1tq6Sp/PmzfvnYXZ7Ew/DI9W0VcrqbbGmFEi4Vk1T6ZdkIKtwIDv1SegmqkkLdnsPVDcwsyV/ANDjerE8t+JROIVqM7fbmyLDsMPNTY2jtiiaofhmcaYAyr6A0RAoNMnNzYetPX7hWOZaP+KhADMam5e1VEi0ZO3fKV0G0FBYBw+So19TkRjYUHuUFJXhQJAfbF6n2W9Nh7nGWUyKD9CaIExde3fFeCkfEG3agaEQFVfdN2iieA6RAB9C4x0viBvOKE+Q0pfCEL1Q6uv+74+01nQP4QWDxnWNdyHGSAiFWV6/vz57ZlM60Od+cJxIvpwJbWemROAfrb8d319fR0qyBQRAYS51cKWuVxuVUtL7pe+H7xXFJNF8a6Fudz9e3SUAQAWL168IhS5UFXbKztK6LRa74+IBjwPXVUD/KvB9n4R0SqDMLr8z+bm5kAVd29HCEXBHOU4fAIAjB07to4IX+jJocXMQ6yhi7o0cmYlgRdrfQ7lHgC47aWpewM4zNpyrF8LbIoOxaAgYKYDiegp4/JnoJBQ4nkodRrm/zEOn1MopTWzIYggUNXQWsX+g/PvLjrgtkYRHKaxCsz2fV1tDFDwFQScYBy9HYRfi8tpYjTlfT1JfXM0k/7OsA4nxtEK2qfoWoENA7vT73fp0qUbQXSxqq6qtNAx0UfKPhxjTAGAX0n2GTjZ87we6xgsWbKkkM1mF2cymX51XP9LNze1trYu8LzkU4b51K5yXjQb0JROp/dvaWl5swbbbpTneYf2Op84FBEnl8lk/L5PRk55ntfRC2kQc7CppWXJPwaED0LaZFmFiEw3zQIKbBM2I2Pus9Z+l4gauq9AJDgTwF2DBtWdRKBJPRFCMYzGnz7kkEOuVm2LhQGO7+pr6KIdzFm4aNFCAAjyzkEgO1JFQQxAaZ0NZQkzvZ8NcRgojOFhsTo+obMjfKLOaj40CF2XkoFfbNuNMYJA3gC0lZmOYSiGux3oToeuSxxaTFaV62Ku+WlnXmEciodWG/J5mlmf0CsJ9BYUx3Jc/sd1+GAQ4PvF0GbRv0x+YrDt6I93lMlk3vJSqXuY6SvdfTgAxhKFKQBz582btyntpZYB2Hc7k5noABJ5Ju0ln1fwCwD+D8CSRD6/onnp0o0DOSd3g92O+ixAp3YPzRPRYFg7DsCbvYXfiHAGoDN6dwyadmvtZAD/7Jt2AIDwK+olfYCZoOo8AeDEARkpovHMbLbzuwAQok3b+EhaWv7heam/MNNJXcm2NJmP9jzvQKh8vjcXackZuW8QFGYAsTZjzLBKhCAqd6K0kUasjHFc5jAQQAHj0H4KvKki3yPiL8TivJ9fkJKzkAYNcjf5G6lhs7U6AgBidYygIC+r4g/G4R+IwqmjEA0mhHbL+PYDBbFOF+iPOjtlRizOU5iBMK9/zjvSkVA+yRiMjsf4stAqCn73yAggVtuooJv7zfRjeVaVvlJB22JRTQGYC0AU+iATT63kRwNRjIiOZ6Lji9mJ4nfGY297qeRiEOYSmReJ6NVa/Gx7hMmw5QaU/1FthRLGfrWb3+DeLt25nGQe6D5UtarpM3bs2DplfKUyKWroiGynlZDozIpDSzSEVK4F6MhaE2FI8WWALqnia1gH8MNdfjCka9atDRWuy+8l5hOs0plBII/F6oqhRygG29gwC2Ajc4kMfJkVWlzEpJcyY7hYIMYWDst2lCwC1NdxAwlNVzJftVYFCpDy74YaPqaujkZbC+QLxS3PxgCuuzUfgokAoreHT1i/uf+kWt5QEVtFnR3T5d5vs9ZmuYojo2sCUjFblccw8zGGzTcJ+pCKnZ9Op347qbEx+W9DCBZoqxZ6ATCon7tTZh7gbEfa8faJDkilUumu16RJjZNTqdSpgxoSDxPxByo58wi6aFM+v90+BScef1xUV1SMXTOfBqCugvPUVjYbyCPgfZVyDxT6WNeIkpLa7jM38AVunKcR9EptowvDQL+l0DwIe6+PFwjQdWxI/LxcbQt7nWtYf+rGTLKc4ci0ndYm5ccKQgVA5+/3x1V/DUP9Q74g68N65y9M+CQz4DpAoo4QcwlWsNIPZDaAViIIG0CB14n6tk24ZwJ125WoilnKg7o4CNeJYoaItHIN3s2u2aol02IfJv60OuZ5z5t4yr8FIRhVrpzYoSClfntJxYmDdSIyYNmDzAwQ7ZD/QEQApu8R9O9dL7H8mmG6n4iPr06c9Ptly5blu//fvHnz3oHiwUrjWznMSAD0OlW8VC3ZpqL2QDqzG6m8LXb79v28IBbn99Mgva/NFm7N53W6QjXWbutVscHPyy8vPWHOt+Bs+EGszpxYjjQAQCgEUSqqgsXcgTdEsZkZCAIgFuPGVWePPgqKvwN4yl0fMLGeEARqrdVsoSA3+SFOZ9YfGkMuEcaVrDyo6rx+dkAXYwUVzT6VblGDhX4QHmdF7gZge0pEq6ZBENFIAv8xnW48co8nBAB7V7XbWTf0acL3cKnqRiX+fmtra9sOE0ovl7Vhi4hev8OkBRgicrtdprwyVCIgK7Kgrr5wa9U2rf2jdDf6q2lrqu+EoVwNol/WIpSlBJrWjRvbn9/WMeUsDa12VNisBz8vcON8xCCK/ZmY/wlFB1kzDERviirf8PQRpzqO+UZQDjsygUhRsAa+GGz1NVEdVJ9wDJXuBVCRbxLjc6q4CwkcDWCthjJl+aa3D/GV/mCMng2lmx1D7xOBq1r0QYAwpz8F2hjZC92cvF0kezuZXrx48YpMJvtJBR0tVm5S1QUA8uVsxZ6yIbv4eRpUzdV9zfLd7ZyKSpTm4oTt/pCq4OU1CaXoIxC5FaYKJ6sJTBAuWrB48dIdIwNAVC4nwYJqfQBoK/j2tSVLlmzaJb6XYnr0G0Thuc3N1T3PdYMHv5rvbJ9HxIf1El6EFXvXokWL1nqe96BYu4SYx/f0m1Iy1azly5dvsydktWPeGB6GGWPMu8MSF6kiMA65YrVICjE+Unx5hJlGKdFIKDKOgx/bEGeAS2nMLiEI5G0AeR/mwI1+DIPqA1gB4jEaXQiQKfiSisXI831FzKUT/UA3xNQ+68PcANBfmHTzAUNH/RbAGa4hp2AVfsmx6BggCPDWoERdc3++GxEz0TC4e4S4qE1Vd2hnMpkXAbzoeV6MORwHayYL9DAlTCLoRIAOIKK6ShpeaQPbe/329iYAr+2phEAKfLiSXSwib4vqP2ohBECXtORyjwzoBBT8ZWEuN+dfOlhbtR2oyBOh6JdyucU9FjJpbm4O0qnUXcTUIyGISKcq3VwSzM2el7yFia7t5TcFEdzT/fMrjpkd3vDE1Fls8G4EADGgVldKiNXGpcNVij4Fx6Em4xDynfYAAIuMMSOhCrGKWJwRFOQ1gJ43hi4OLPBWoQFjBrUXvRzFzQ9HA7gKoD8AxUpLCPSlEcl1m1ctGvU+ZlUr/MmES3vlC4pyQlMZbozgB/r00LFvbOjfNyUnA121mS2EUCDWXmsclsLiudJ1LwBMnTo10dbW9h9QPV6h/0VE+1Xw5xgLnbwzhPAvNRk8zzuNmaZWdpTRK7lcrqbcbNo1xBbbVRO+0gVAVHWlFflfUXx0YSZ7Yq1Vjdhx/les3dyj7wP6cNeCnGEod4jIqmqqapGY8FIul6so4BzYO/y8vGUMFfcyOHwgCO8Evl4JwiY3xrBh8b0bYLxYXeYXJAC0GGkI9AEL/bZhnAmg3jWEle2JuTbECmOKOxnZ0PvY4B+Fgj5QV0dF4gE/uiI7YgIRxhlDE5mxV2e+WKfRdcr+h6LW5/uqhvDb/nyHk5LJIwh0SqXQLKCZeHzwDvmYXn755c6WlpbswkzmRiv66eoRKRm1W/oQjDHSCxmcQtBbKt1DaZPMnX2xPHbBZJWBJgOx8htRnGNFzy1fonKWWjmZRd+joKZMJntaJpN5CH0onrlgwYKlCnqumidbRCzstr6PRYsWrVXo7T0RAhXfUcWxv+Qjc98SyA9McfcixCq5Mf4gszZa1Y+Foc6N1XHZfTxxaF3dWwSsd2KMwJdf2AJfbAhXGodHi1UYB1iTj13lGvllPF5MU47HyYQWZ1kjX/d9ae/Mq0KDZ9jw0XV15IgAsRihro6ggneCQF9T0WVE0HiMEIT6Qm7V6uf7YKb1OObpdPpIZbqTiBKVzSu6u3spuylTprjpVOobk9Leo+l06jrP87ze7sO19h9A5SpJRLRTc2GgVlYCMKjrVltrLdXVyRDfdyYz41yozig7zCqYC/Pa2jY/3JfVu9K23koYsmmTfbmbzVuTw41sQ619JBKJQo01DLtPsOdbMpk7B+KFKDBTVU+u4hh8NtPaWsEc4l9ZkS8SMLT7yxWRNWRMj2bavhsO/NXqoW9Oi9c7ZxQ6LQJfEKszp/m+ItxsT8Yg/i/H5S8rMPH8Y2bnb3hq6mI/H1596QmvXHfjk0fc7cbNYX5e4LiMIC+Z/OrYY046+EtHJ1/ounyQ7yuY6HTaZL5lB8t1pHr+/sl1i1e1jrrKMCCCFQVfnyfos0wcU8YMENJQUBBqyMLfO+aY2suPUTcZsNaSMaaByCYhfCZUPkVEiSoyvdK4hd91b7Ozs/0aY8yXiqnN/GFRudDzUvcw60wRbs5kMttoduPHjx8prrmCiOKVzDlVXb3bEUJpUJ4gQlh0uJE6TBz4ZohhGkoABJU956pqifVby2uctKWdZGcRdHothUvbBg8OJnnJZqv0rWw2u6ymyVRMdPktSPO19JHv7NjkJZOzEg0NP+kjMQyYWRLr6HgyqE8sZ+Yx2zuk9PpKK30mk3nD85J3MZvPb1MrgRlq5dHesuRmzJhlr3/58Iv9Nrt3PGFOKHTaYuixjk/z68lx9/JnFDY4LwP00589MbkBSi901PNtNzwx9ZuxOj7Dz0speqAKyGVXnD87fwWQX5Hb56uq+icRcF0djSqonGxF2kD8yptzxsTNcD8s5HEc+/Kq79C4mEPfAOnpjqF4ECjqE4TN7Xr9/t5bs/vGqnwnQQtdZRoqgwDemw2jWsUjIoJa+f78+Uvf3kajSCY/RcRfki2OVwWAwYb5QhG5ENDX014yB6XlWqz6OgrQw4m42mY0EcGC3VJDYKYxW9cTbNm0rqpV9Xtmhtjwxy2Z1if62N9gIhpcU91SApjNeA3DBIBTazU3iHn0Ns/Tq93OTfn29mUA7sBugHnLlr2TTqUeJKIvloWptHL9raGh4cnqZEg3i8inASS6RoBKZdJ6xZenvrrpJ09NOX1QPnZrLM5nhIGWSMGc6m+guzWwXyaHYjFn0GiEsqy+E1cq4cIgKFZPicUNOjvtNV/+4Ctbin/sn3z7weXZfa4Z1MDfDEJAod9kptEK/W8aXmgUS3M6JMzF4s41LnBezKW6fEFhraKhntDeIY/sF098ZwcWun23k2kU90RUi+wyM0Jrf5vN5W7vZl6koPaWqoscACY6CKCDqJyVpQoFoYcaCn9n5oW7pQ+hHDvvevXmTBNrr23Jtl7RX/1Vu0oDfvi4ceOGDET7W56VcEwf1foBPSeDVO+ULim1BIBAN/SkxWSz2RYFHiz7H0okktvU0fFirf3+1wnNG2evH3O2H8g3QNhYiiDAcfnj5PC9zDSUQttIzPMdly9hQ3UAIVY8s+HW9W7s8u5t7p884DvtnXKf6wKOS+8ion1VnOeNUlNdnE532cyri9NnAdSVayfUJwgdnfqnzrbgHDpo+0SuHZOB6jZzcYGzd7a1bf5id5+PtfZtBd231eFYvb8tRVZ7mUcs+uMd2ri3u0QZyokXqrpaVC5uyea+DkB2Rd8KcCwWG+joRJ9MACUa0BqPw0eNmqvA/20hYNVFxnX/1LtZpjeISLjV10H3VsqM7AmzZsyylx435xqxcpQNdRYIlhmIxc0RsTpOANS0dsM7zYFv34nFDZjQ6Rfs5ZccP+fzVxwzO9xedpqDmNgLOjv1sYZ6ggheH5Na2Qrg8EQ9H2EMjciXiaCeQMCGzoJevmLT6jMPfveGjQMu06BNYuXb3qSm8yqZv7lcbl0mkz1PoV9Q1bXMvMP9lRzSP+qPugg7RQiqamrJ4Ot+lbOvVHWFqPw8tDI1k8ndVsPTuzvSX5Uwnlvhebi/2i9dlSIoRESm+3iUwoKvDCQhFA+lobu2pMeK3lLLCT+5XO5lVTxrmGGtDZTo3h29h0tPeHnBF459aYYhnRb48scwlI3MBDCdM3LYXj81hkwYyjOBr8dfesLLV1EPW0xHpta1tSE4c3ObPhRzMXrV4lHXKeFkqCIWo3LdxqWFgl7r+3bqvhNWX/Xud/d2AsuOyUAXmV6rYn9jRY5syWavnDVrVo+1OlpasreI4n2i8lsAHVsyE2skHgCrROWzmVzuu/0hIzu1QjLT2yqSqzEzVkHUQdDVKpQl4MXA2hd7O42oi+de8h3tWRHZuKMVarcJAQHr4vG47fb5JhHJ7Wz7W61M3W7rtjGmUyVsUS3nPJISYyUpfp7N9XyQSn/AWvu/UP0MgI5QZGat3M+q16jqeIBezWQy2Z29j88f+/JfAfz1l0+9f1zn5vAUY+gTgDaJ0Flrn3/p0SuuqE1TbGxcv+n158aeUT8mf5khpEE0u22z3qegpYZkngllwcjUurY+yPQ7fZABJUJeQWtItBWsLzmBfWHe4sUr+jIWpQN0LkilUtdCZQYUH4RqI4iGUTd7onRf76hqTlQecAM7c2Ef++tdbnccxvM8U+OE1ubm5hA7kTMwZcoUt7Ozs1/s7NL9dF8t2PO8fjMjRo4cKV2PiiuPued5bi/3MaAYO3Zsneu62tfj9KZMmVI/aNAgv8Iz/TuhZhkovTs7AGYueZ43yhjZPwxpHyIaRKqsRJ0ssoZc980FCxaswL/POSURIkSIECFChAgRIkTYM0DREET4V8DzvJi1Nj5s2LCwP45RjxARQoQ9DKlUaiyzfgxKx6viYILWKxAQYQWI5qjSnzKZzKu9tHGcMXyG2h79eKqkawz4Vd/a56oVxUlPnHg0uc5ZvbS17YRhAKpLF2ZyPyl/NmlS8giAztc+HAZADIjq8kwm9yOUnJKe5x1O1g5rae1bpq7nTTyNYI4jJmNtcH82u+ixHX1HTiSmEQYaU6ZMqc93dHwThC8ymREKLRU53RJvP5iIPiAqX0t73v2i+u1SKG47GKJDDfNFtUxhVYVrODspmfx2paQdYp5ca1tbflM8R3E+gJ90YR/PMeYi6YPTv7i/IVwM4MddPh5Pjvm15038VCbTel8t7UxqbEyK0l1syGFmiPBydDuqry/gSFwjDCQOmTBh/0Jnx5/Z8PeJaEQ5Z6Vbklg5ndxhptOZaXY6PXF6lUkebknl3bKZSIs70EpXt2rFKWW+10smz9uRtra7AKhiVX+0A+AtbBuy9IkowWRmplOpz9QyvtaYfYjIKfcNYKdC2JGGEGHAkEwmhwdE9xvm95SKgZaz+VpVdI5AVhHRMFJMJeZDy8RARPuqmllNqdTHF2SzT/fUh6jOJtE1WyZnUfcYDughzDysVJ3YAdP1qVTqpWqaR3FiywsqWN2ThU0qG9naHg8iFtGXCLqyaj9FPWOTFdyMbrkE5ePdielXnjdxaCbTem1vilB/vrOIECIMGJjpuq5koKproLjMuO7dXVOmPc+LqeKjBP0pMx9UPN+TB9vQXgDgWVRJ/ClqF/bylkzrS93/b3Jj40Eh0Y1MdFKpCOlesPJZAF+v2pbV7y7M5WbvzDOX9oj8OJPNPbqjbRQVCGUmc43nJYdlMrnv7LJ3FolthIFAKpU6jonOKZMBoG+RlRNbstnfdN8/kclk/EwmMyu0cqyKPKKK1tCG/2lc9yL0ngVYcQPZ/EWLXmc2nxGR1bSliK8eN23aNKevbe0A3P5oRFVhmL+dTqVu7OW+I0KIsJtrB6SXdtncpVbwlYWtrX/r6Tetra3/XJjJnry5vf3QTCb381o2XvWEhQsXrgZR1z5Hr1+/fvCeNI4iCjZ8ydo1q387derUREQIEfZE38G+qpi21VSQV7PZ7Kxaf9/XrdW9WNjSxdgmay31oO73S79EVOindlD2qzCbczZt3HjPIYccMnQg313kQ4jQ7zBGJxLM0JJDDwp6pIrqTzVP6x3AuHHj9gL00HI3RFhbl0hU3fko0PPTqdRRle6LmRGKvJLtxclZVPXlnHQq9a4e2nktm80+1nsz8oQC05g5ISIwhk8OA/8Bz/PO7Hp0XkQIEXZrqNK+RFvtYBJsVy4+nZp4LYin9VBRr0guTBSK/jCbzT7Yl9U4mUwON4yry/UHmRkq9FK1naWqCmI+v1r1ImYGifwSwNM12P1n99QOi/weveQKEBFZxa1EcguAmUQ0uKgp8DQR+XNT04TTFyzYsYOHIkKIsKsJwXRdG5U13H7Jp7RhntJb3QFiBmlwYLXJp4Lvp1OpVd1W42GAHkrEB5bbF5FAiX7d+71r9c9J3659DKq3ozW2Q6SJTKb1rlQq9XEm3ElE+5RI4V1inccmTWr8KJF2iKWIECLsvmCWNSjVfynWYMTYCrbCQiKaXnXSbEkCUqhye/W+eHr31bj4WyqfkFw0W8T+rCWT7TEtWkSyIHqnu6pPAMSGy4jM7bU8v6i2AlhfqR0rdrkTyi19Gc9sNvt0UzJ5ojDuJaJxJd9Mo4h5lBS3gGABmIgQIuyePoRAF4VGOoioXlUBxXQAP99G8GLxH9kgWCaQfbaZNEoK0o+Uz6Isqvu6vNa+u1XvUlWsUwlv9iZN/uHCTK4nFR2s+NKCTO8+gl5Ufajim6XDdPoNC3K55lQq9SFWvZcNHyoiYKKDFPrTyGSIsFtj/qJFy9Je8m9E9IHihKZjUqnUUdls9oXyd+bNm/cOgBsr/T7tpU7oMqM3sQkzPazGD5OUswI1psAMJmrQMj+ofjGbbb23Jdu6x49rNptdnEwmTySRPzLz0SXy69cNilHYMcJAQFTwP1tLhVKMiW5paho/prcfppPJC4novVscgYrnFyxYsrzqqs56VUs2+7nilbuAGN+hrSXjDUMva2pqGlaj3d8vk6u/2qmEXC63qiNfONWK/GlHKzVHhBBhlyPR0HCfiH22VGYfREiLdR73PO/YSt+fNm2a43nJi8D0i/KEUlVR4Be9TL54179bWnI3WJH7y/2yMYfaMPxFjer+bpWHUA1Lly7d6PvBWWLlNqb+5Z7IZIgwIGhubg5SqdTnVOQZJjqgSAqchuqTaS/1LBRPKcnrgCFSnbB2zdsnM/GWk8CZGVbsr7LZ3DN91U6slUsIOIyI/qPoladPeV7yr5lM7lc9EAsU+jnPS36wp7kO8OpEIn9Hc/PSjdXaAfQCz0se2YurYa0q35HJZNbvyPiWCuR+Np1KrSWmy/qjUnhECBF2hc17Khncw8zjSzavIaITiOmEsmZNpdW8KxmI2AccJ/b1Whbk7h+0trau9LzGz0PNw2UZJ9DPUqnU3Gw2+/eqDTGf1duKS0TId8QnAfhsVbWb+HSqoZ3QhlMAnNuD/tPb8q8t2ezlnpdcS6CriXY+0hCZDBEGFLlc7jUuBMeI6EwAYdnuLdcN6HK0XumwE2xWsVdubu/8ZKW9DF0PuQEAa6niSp3JLHpcRX9S7s8YM4SAOw899NCRXQjAdK/LUNNRfdD3dtMKdqgdUj0cXcKF3Q8KUuUNtYxxJpO7DqIXqMLHTm7QijSECAOOBUuWLAdw7qRk8pcKe64CHwBojKrWUzEtebMC/1ToUyL4Qzaba6lqD8C+AcHzgIZW8MyoUaPm53KVw4nppqb/bmlpeYeA6aG1MSZywkLhZAC3A4BVfRMiz0sf9G1SgAnbRD2YsUJE+9yOEv0DXdKyjTGrReR5glprZW7b5s1/qbW9llzujnR6Yjsr79QGqKimYoRdDs/zYsaYfay1Q5hZwjDc2NSUe3vWLNhd0D1jF50fGiFChAgRIkSIECFChAgRIkSIECFChAgRIkSIECFChAgRIkSIECFChAgRAPw/bdxewbks070AAAAASUVORK5CYII=";

const SHEET_NAMES = {
  TASKS: 'Tasks',
  PROJECTS: 'Projects',
  TEAM: 'TeamMembers',
  COMMENTS: 'TaskComments',
};

const HEADERS = {
  TASKS: ['ID', 'Title', 'Description', 'Project ID', 'Assignee ID', 'Priority', 'Status', 'Start Date', 'Due Date', 'Created At', 'Updated At'],
  PROJECTS: ['ID', 'Name', 'Client Name', 'Description', 'Color', 'Start Date', 'End Date', 'Status', 'Created At'],
  TEAM: ['ID', 'Name', 'Role', 'Email', 'Color', 'Active', 'Password'],
  COMMENTS: ['ID', 'Task ID', 'Author ID', 'Text', 'Created At'],
};

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : 'getAll';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    ensureSheetsExist(spreadsheet);

    if (action === 'getAll') {
      const data = {
        tasks: getSheetData(spreadsheet, SHEET_NAMES.TASKS),
        projects: getSheetData(spreadsheet, SHEET_NAMES.PROJECTS),
        teamMembers: getSheetData(spreadsheet, SHEET_NAMES.TEAM),
        comments: getSheetData(spreadsheet, SHEET_NAMES.COMMENTS),
      };
      return createJsonResponse({ success: true, data: data });
    }

    if (action === 'getTasks') {
      return createJsonResponse({ success: true, data: getSheetData(spreadsheet, SHEET_NAMES.TASKS) });
    }

    if (action === 'getProjects') {
      return createJsonResponse({ success: true, data: getSheetData(spreadsheet, SHEET_NAMES.PROJECTS) });
    }

    if (action === 'getTeam') {
      return createJsonResponse({ success: true, data: getSheetData(spreadsheet, SHEET_NAMES.TEAM) });
    }

    if (action === 'getComments') {
      return createJsonResponse({ success: true, data: getSheetData(spreadsheet, SHEET_NAMES.COMMENTS) });
    }

    return createJsonResponse({ success: false, error: 'Unknown GET action: ' + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: 'Empty post body' });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    ensureSheetsExist(spreadsheet);

    switch (action) {
      case 'createTask':
        return appendRow(spreadsheet, SHEET_NAMES.TASKS, taskToRow(payload.data));

      case 'updateTask':
        return updateRowById(spreadsheet, SHEET_NAMES.TASKS, payload.data.id, taskToRow(payload.data));

      case 'deleteTask':
        return deleteRowById(spreadsheet, SHEET_NAMES.TASKS, payload.id);

      case 'createProject':
        return appendRow(spreadsheet, SHEET_NAMES.PROJECTS, projectToRow(payload.data));

      case 'updateProject':
        return updateRowById(spreadsheet, SHEET_NAMES.PROJECTS, payload.data.id, projectToRow(payload.data));

      case 'deleteProject':
        return deleteRowById(spreadsheet, SHEET_NAMES.PROJECTS, payload.id);

      case 'addTeamMember':
        return addOrUpdateTeamMember(spreadsheet, payload.data);

      case 'updateTeamMember':
        return updateRowById(spreadsheet, SHEET_NAMES.TEAM, payload.data.id, teamToRow(payload.data));

      case 'resetPassword':
        return resetTeamMemberPassword(spreadsheet, payload.email, payload.password);

      case 'deleteTeamMember':
        return deleteRowById(spreadsheet, SHEET_NAMES.TEAM, payload.id);

      case 'addComment':
        return appendRow(spreadsheet, SHEET_NAMES.COMMENTS, commentToRow(payload.data));

      case 'sendEmail':
        return handleSendGmailNotification(payload);

      default:
        return createJsonResponse({ success: false, error: 'Unknown POST action: ' + action });
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Send Gmail Notification via MailApp & GmailApp with CID Inline Images and Native Attachments
 */
function handleSendGmailNotification(payload) {
  try {
    var recipientEmail = payload.recipientEmail || payload.to;
    var subject = payload.subject;
    var htmlBody = payload.htmlBody || payload.body;

    if (!recipientEmail || !subject) {
      return createJsonResponse({ success: false, error: 'Missing recipientEmail or subject' });
    }

    var mailOptions = {
      htmlBody: htmlBody,
      name: 'Green Deepwoods'
    };

    // Include logo inline image attachment only if referenced in htmlBody
    if (htmlBody && htmlBody.indexOf('cid:company_logo') !== -1) {
      try {
        var logoBlob = Utilities.newBlob(Utilities.base64Decode(LOGO_BASE64_DATA), 'image/png', 'company_logo.png');
        mailOptions.inlineImages = {
          company_logo: logoBlob
        };
      } catch (logoErr) {
        Logger.log('Logo blob conversion error: ' + logoErr);
      }
    }

    // Native Gmail File Attachments
    var scriptAttachments = [];
    if (payload.attachments && payload.attachments.length > 0) {
      for (var i = 0; i < payload.attachments.length; i++) {
        var att = payload.attachments[i];
        if (att.dataUrl && att.dataUrl.indexOf('base64,') !== -1) {
          try {
            var parts = att.dataUrl.split('base64,');
            var contentType = parts[0].split(':')[1].split(';')[0];
            var base64Data = parts[1];
            var decodedBytes = Utilities.base64Decode(base64Data);
            var blob = Utilities.newBlob(decodedBytes, contentType, att.fileName || 'attachment');
            scriptAttachments.push(blob);
          } catch (attErr) {
            Logger.log('Attachment conversion error: ' + attErr);
          }
        }
      }
    }

    if (scriptAttachments.length > 0) {
      mailOptions.attachments = scriptAttachments;
    }

    var sent = false;

    // Primary: MailApp
    try {
      MailApp.sendEmail(recipientEmail, subject, '', mailOptions);
      sent = true;
    } catch (e1) {
      Logger.log('MailApp with inlineImages failed, trying GmailApp: ' + e1);
      try {
        GmailApp.sendEmail(recipientEmail, subject, '', mailOptions);
        sent = true;
      } catch (e2) {
        Logger.log('GmailApp also failed: ' + e2);
        try {
          // Fallback without inlineImages
          MailApp.sendEmail(recipientEmail, subject, '', {
            htmlBody: htmlBody,
            name: 'Green Deepwoods'
          });
          sent = true;
        } catch (e3) {
          Logger.log('Fallback MailApp failed: ' + e3);
        }
      }
    }

    if (sent) {
      return createJsonResponse({ success: true, message: 'Email sent successfully to ' + recipientEmail });
    } else {
      return createJsonResponse({ success: false, error: 'Failed to send email' });
    }
  } catch (err) {
    Logger.log('Gmail send exception: ' + err);
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// Case-insensitive sheet finder helper
function getSheetByNameFlexible(spreadsheet, name) {
  let sheet = spreadsheet.getSheetByName(name);
  if (sheet) return sheet;

  const sheets = spreadsheet.getSheets();
  const targetLower = name.trim().toLowerCase();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().trim().toLowerCase() === targetLower) {
      return sheets[i];
    }
  }
  return null;
}

// Helper: Ensure sheets exist efficiently
function ensureSheetsExist(spreadsheet) {
  setupSheet(spreadsheet, SHEET_NAMES.TASKS, HEADERS.TASKS);
  setupSheet(spreadsheet, SHEET_NAMES.PROJECTS, HEADERS.PROJECTS);
  setupSheet(spreadsheet, SHEET_NAMES.TEAM, HEADERS.TEAM);
  setupSheet(spreadsheet, SHEET_NAMES.COMMENTS, HEADERS.COMMENTS);
}

function setupSheet(spreadsheet, name, headers) {
  let sheet = getSheetByNameFlexible(spreadsheet, name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E2E8F0');
    sheet.setFrozenRows(1);
  }
  applySheetValidationRules(sheet, name);
}

function applySheetValidationRules(sheet, name) {
  try {
    if (name === SHEET_NAMES.TEAM) {
      const roleRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['Admin', 'Product Manager', 'Employee'], true)
        .setAllowInvalid(true)
        .build();
      sheet.getRange('C2:C500').setDataValidation(roleRule);

      const activeRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['TRUE', 'FALSE'], true)
        .setAllowInvalid(true)
        .build();
      sheet.getRange('F2:F500').setDataValidation(activeRule);
    } else if (name === SHEET_NAMES.TASKS) {
      const priorityRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['Low', 'Medium', 'High', 'Urgent'], true)
        .setAllowInvalid(true)
        .build();
      sheet.getRange('F2:F500').setDataValidation(priorityRule);

      const statusRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['To Do', 'In Progress', 'In Review', 'Done'], true)
        .setAllowInvalid(true)
        .build();
      sheet.getRange('G2:G500').setDataValidation(statusRule);
    } else if (name === SHEET_NAMES.PROJECTS) {
      const projStatusRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['Active', 'On Hold', 'Completed'], true)
        .setAllowInvalid(true)
        .build();
      sheet.getRange('H2:H500').setDataValidation(projStatusRule);
    }
  } catch (err) {
    Logger.log('Validation setup error: ' + err);
  }
}

// Helper: Read sheet rows into JSON objects
function getSheetData(spreadsheet, sheetName) {
  const sheet = getSheetByNameFlexible(spreadsheet, sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const dataRows = rows.slice(1);
  const timeZone = spreadsheet.getSpreadsheetTimeZone() || 'GMT';

  return dataRows.map((row) => {
    if (sheetName === SHEET_NAMES.TASKS) {
      return {
        id: String(row[0] || ''),
        title: String(row[1] || ''),
        description: String(row[2] || ''),
        projectId: String(row[3] || ''),
        assigneeId: String(row[4] || ''),
        priority: String(row[5] || 'Medium'),
        status: String(row[6] || 'To Do'),
        startDate: formatDateValue(row[7], timeZone),
        dueDate: formatDateValue(row[8], timeZone),
        createdAt: formatDateValue(row[9], timeZone),
        updatedAt: formatDateValue(row[10], timeZone),
      };
    }
    if (sheetName === SHEET_NAMES.PROJECTS) {
      return {
        id: String(row[0] || ''),
        name: String(row[1] || ''),
        clientName: String(row[2] || ''),
        description: String(row[3] || ''),
        color: String(row[4] || '#06B6D4'),
        startDate: formatDateValue(row[5], timeZone),
        endDate: formatDateValue(row[6], timeZone),
        status: String(row[7] || 'Active'),
        createdAt: formatDateValue(row[8], timeZone),
      };
    }
    if (sheetName === SHEET_NAMES.TEAM) {
      return {
        id: String(row[0] || ''),
        name: String(row[1] || ''),
        role: String(row[2] || ''),
        email: String(row[3] || ''),
        color: String(row[4] || '#2563EB'),
        active: String(row[5]).toUpperCase() !== 'FALSE',
        password: String(row[6] || ''),
      };
    }
    if (sheetName === SHEET_NAMES.COMMENTS) {
      return {
        id: String(row[0] || ''),
        taskId: String(row[1] || ''),
        authorId: String(row[2] || ''),
        text: String(row[3] || ''),
        createdAt: formatDateValue(row[4], timeZone),
      };
    }
    return {};
  });
}

function formatDateValue(val, timeZone) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, timeZone, "yyyy-MM-dd");
  }
  return String(val);
}

function appendRow(spreadsheet, sheetName, rowValues) {
  const sheet = getSheetByNameFlexible(spreadsheet, sheetName);
  if (!sheet) return createJsonResponse({ success: false, error: 'Sheet not found: ' + sheetName });
  sheet.appendRow(rowValues);
  return createJsonResponse({ success: true, message: 'Row appended to ' + sheetName });
}

function updateRowById(spreadsheet, sheetName, id, rowValues) {
  const sheet = getSheetByNameFlexible(spreadsheet, sheetName);
  if (!sheet) return createJsonResponse({ success: false, error: 'Sheet not found: ' + sheetName });

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const range = sheet.getRange(i + 1, 1, 1, rowValues.length);
      range.setValues([rowValues]);
      return createJsonResponse({ success: true, message: 'Row ' + (i + 1) + ' updated in ' + sheetName });
    }
  }
  sheet.appendRow(rowValues);
  return createJsonResponse({ success: true, message: 'ID not found, row appended to ' + sheetName });
}

function addOrUpdateTeamMember(spreadsheet, memberData) {
  const sheet = getSheetByNameFlexible(spreadsheet, SHEET_NAMES.TEAM);
  if (!sheet) return createJsonResponse({ success: false, error: 'Sheet not found: ' + SHEET_NAMES.TEAM });

  const rows = sheet.getDataRange().getValues();
  const normalizedEmail = String(memberData.email || '').trim().toLowerCase();
  const rowValues = teamToRow(memberData);

  if (normalizedEmail) {
    for (let i = 1; i < rows.length; i++) {
      const existingEmail = String(rows[i][3] || '').trim().toLowerCase();
      if (existingEmail === normalizedEmail) {
        const range = sheet.getRange(i + 1, 1, 1, rowValues.length);
        range.setValues([rowValues]);
        return createJsonResponse({ success: true, message: 'Updated existing team member: ' + normalizedEmail });
      }
    }
  }

  sheet.appendRow(rowValues);
  return createJsonResponse({ success: true, message: 'Appended new team member: ' + normalizedEmail });
}

function resetTeamMemberPassword(spreadsheet, email, newPassword) {
  const sheet = getSheetByNameFlexible(spreadsheet, SHEET_NAMES.TEAM);
  if (!sheet) return createJsonResponse({ success: false, error: 'Sheet not found: ' + SHEET_NAMES.TEAM });

  const rows = sheet.getDataRange().getValues();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    const rowEmail = String(rows[i][3] || '').trim().toLowerCase();
    if (rowEmail === normalizedEmail) {
      sheet.getRange(i + 1, 7).setValue(newPassword);
      return createJsonResponse({ success: true, message: 'Password updated for ' + email });
    }
  }
  return createJsonResponse({ success: false, error: 'Team member email not found: ' + email });
}

function deleteRowById(spreadsheet, sheetName, id) {
  const sheet = getSheetByNameFlexible(spreadsheet, sheetName);
  if (!sheet) return createJsonResponse({ success: false, error: 'Sheet not found: ' + sheetName });

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true, message: 'Row ' + (i + 1) + ' deleted from ' + sheetName });
    }
  }
  return createJsonResponse({ success: false, error: 'ID not found in ' + sheetName });
}

function taskToRow(task) {
  return [
    task.id || '',
    task.title || '',
    task.description || '',
    task.projectId || '',
    task.assigneeId || '',
    task.priority || 'Medium',
    task.status || 'To Do',
    task.startDate || '',
    task.dueDate || '',
    task.createdAt || new Date().toISOString(),
    task.updatedAt || new Date().toISOString(),
  ];
}

function projectToRow(proj) {
  return [
    proj.id || '',
    proj.name || '',
    proj.clientName || '',
    proj.description || '',
    proj.color || '#06B6D4',
    proj.startDate || '',
    proj.endDate || '',
    proj.status || 'Active',
    proj.createdAt || new Date().toISOString(),
  ];
}

function teamToRow(team) {
  return [
    team.id || '',
    team.name || '',
    team.role || '',
    team.email || '',
    team.color || '#2563EB',
    team.active !== false ? 'TRUE' : 'FALSE',
    team.password || '',
  ];
}

function commentToRow(comm) {
  return [
    comm.id || '',
    comm.taskId || '',
    comm.authorId || '',
    comm.text || '',
    comm.createdAt || new Date().toISOString(),
  ];
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this function manually in Apps Script editor to update dropdown validations on Google Sheets
 */
function setupSheetValidations() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(spreadsheet);

  // Auto-clean any existing 'Member' entries to 'Employee'
  const teamSheet = getSheetByNameFlexible(spreadsheet, SHEET_NAMES.TEAM);
  if (teamSheet && teamSheet.getLastRow() > 1) {
    const range = teamSheet.getRange(2, 3, teamSheet.getLastRow() - 1, 1);
    const values = range.getValues();
    let updatedCount = 0;
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]).trim().toLowerCase() === 'member') {
        values[i][0] = 'Employee';
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      range.setValues(values);
      Logger.log('Updated ' + updatedCount + ' legacy "Member" roles to "Employee"');
    }
  }

  Logger.log('Google Sheets validation rules applied successfully!');
}
