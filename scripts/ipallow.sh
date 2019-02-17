#!/bin/bash
hostapd_cli all_sta | grep '..:..:..' > /tmp/maccheck.log
while [ TRUE ]
do
	hostapd_cli all_sta | grep '..:..:..' > /tmp/maccheck2.log
	for aa in $(cat /tmp/maccheck.log | xargs)
	do
		chk=$(grep "${aa}" /tmp/maccheck2.log | wc -l)
		if [ ${chk} -eq 1 ];then
			continue
		elif [ ${chk} -eq 0 ];then
			ndsctl json | jq ".clients[] | select(.mac==\"${aa}\")" | jq '.ip'
			echo 'ok'
		fi
	done
	hostapd_cli all_sta | grep '..:..:..' > /tmp/maccheck.log
	sleep 1
done
