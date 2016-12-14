delimiter //
set global event_scheduler =1;
create procedure delold()
begin
	delete from bfsort.sortdata where updatedAt<date_sub(now(),INTERVAL 7 DAY);
end;


create event if not exists deloldevt on schedule
every 1 day starts '2016-11-29 04:00:00' 
do call delold();

